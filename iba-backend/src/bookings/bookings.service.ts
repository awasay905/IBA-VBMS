import {
    Injectable,
    NotFoundException,
    ConflictException,
    ForbiddenException,
    BadRequestException,
} from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import {
    IsUUID,
    IsInt,
    IsString,
    IsNotEmpty,
    IsDateString,
    Min,
    Max,
    ValidationArguments,
    ValidationOptions,
    registerDecorator,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateBookingDto {
    @IsUUID() room_id: string;
    @IsDateString() @IsNotPastDate() date: string;
    @Type(() => Number) @IsInt() @Min(1) @Max(7) slot_id: number;
    @IsString() @IsNotEmpty() purpose: string;
}

export function IsNotPastDate(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: "isNotPastDate",
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const bookingDate = new Date(value);
                    const today = new Date();
                    const currentYear = new Date().getFullYear();
                    if (bookingDate.getFullYear() !== currentYear) return false;
                    // Reset time to start of day for accurate date-only comparison
                    today.setHours(0, 0, 0, 0);
                    return bookingDate >= today;
                },
                defaultMessage(args: ValidationArguments) {
                    return "Booking date cannot be in the past";
                },
            },
        });
    };
}

const SELECT = `
  id, date, slot_id, purpose, status, reviewed_by, created_at, updated_at,
  users!bookings_user_id_fkey(id, erp, name, email),
  rooms(id, name, buildings(id, name)),
  time_slots(id, start_time, end_time, label)
`;

@Injectable()
export class BookingsService {
    constructor(private supabase: SupabaseService) {}

    async findAll(filters: { status?: string; userId?: string } = {}) {
        let q = this.supabase.db.from("bookings").select(SELECT).order("created_at", { ascending: false });
        if (filters.status) q = q.eq("status", filters.status);
        if (filters.userId) q = q.eq("user_id", filters.userId);
        const { data, error } = await q;
        if (error) throw error;
        return data;
    }

    async findOne(id: string) {
        const { data, error } = await this.supabase.db.from("bookings").select(SELECT).eq("id", id).single();
        if (error || !data) throw new NotFoundException("Booking not found");
        return data;
    }

    async create(userId: string, dto: CreateBookingDto) {
        // 1. Check for blocked slot
        const { data: blocked } = await this.supabase.db
            .from("blocked_slots")
            .select("id")
            .eq("room_id", dto.room_id)
            .eq("date", dto.date)
            .eq("slot_id", dto.slot_id)
            .single();
        if (blocked) throw new ConflictException("This slot is blocked by admin");

        // 2. Check for conflicts
        const { data: existing } = await this.supabase.db
            .from("bookings")
            .select("id, user_id, status")
            .eq("room_id", dto.room_id)
            .eq("date", dto.date)
            .eq("slot_id", dto.slot_id)
            .in("status", ["pending", "approved"]);

        if (existing && existing.length > 0) {
            // Scenario A: Someone is already APPROVED
            if (existing.some((b) => b.status === "approved")) {
                throw new ConflictException("This slot is already officially booked");
            }

            // Scenario B: I have a PENDING request already (TC-BOOK-002)
            if (existing.some((b) => b.user_id === userId)) {
                throw new ConflictException("You have already submitted a request for this slot");
            }

            // Note: If there are other people's PENDING requests, we do NOT throw.
            // We proceed to let this student apply too.
        }

        const { data, error } = await this.supabase.db
            .from("bookings")
            .insert({
                user_id: userId,
                room_id: dto.room_id,
                date: dto.date,
                slot_id: dto.slot_id,
                purpose: dto.purpose,
                status: "pending",
            })
            .select(SELECT)
            .single();
        if (error) {
            // Handle the Race Condition: PostgreSQL error code 23505 is a unique constraint violation
            // This happens if another request inserted the same slot between our check and our insert.
            if (error.code === "23505") {
                throw new ConflictException("This slot was just booked by another user");
            }
            throw error;
        }
        return data;
    }

    async updateStatus(id: string, status: "approved" | "rejected", reviewerId: string) {
        try {
            const { data, error } = await this.supabase.db
                .from("bookings")
                .update({ status, reviewed_by: reviewerId })
                .eq("id", id)
                .select(SELECT)
                .single();

            if (error) throw error;
            if (!data) throw new NotFoundException("Booking not found");

            // Auto-reject competitors logic
            if (status === "approved") {
                const roomId = (data as any).rooms.id; // Extracting raw ID from joined selection
                const { date, slot_id } = data;

                await this.supabase.db
                    .from("bookings")
                    .update({
                        status: "rejected",
                        reviewed_by: reviewerId,
                    })
                    .eq("room_id", roomId)
                    .eq("date", date)
                    .eq("slot_id", slot_id)
                    .eq("status", "pending")
                    .neq("id", id);
            }

            return data;
        } catch (error) {
            // Handle the Race Condition:
            // This triggers if another PO approved a different request for this slot
            // between the time this PO loaded the page and clicked 'Approve'.
            if ((error as any).code === "23505") {
                throw new ConflictException("This slot has already been assigned to another student.");
            }
            throw error;
        }
    }

    async cancel(id: string, requesterId: string, requesterRole: string) {
        const booking = await this.findOne(id);

        // Only the owner or admin/PO can cancel
        if (requesterRole === "student" && (booking as any).users?.id !== requesterId) {
            throw new ForbiddenException("You can only cancel your own bookings");
        }
        if (!["pending", "approved"].includes((booking as any).status)) {
            throw new BadRequestException("Only pending or approved bookings can be cancelled");
        }

        const { data, error } = await this.supabase.db
            .from("bookings")
            .update({ status: "cancelled", reviewed_by: requesterId })
            .eq("id", id)
            .select(SELECT)
            .single();

        if (error || !data) throw new NotFoundException("Booking not found");
        return data;
    }
}
