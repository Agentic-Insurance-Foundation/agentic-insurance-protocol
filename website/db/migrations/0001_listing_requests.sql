CREATE TABLE "listing_requests" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "listing_requests_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"company" text NOT NULL,
	"website" text NOT NULL,
	"server" text,
	"countries" text[] NOT NULL,
	"role" text NOT NULL,
	"register_numbers" text,
	"message" text,
	"status" text DEFAULT 'received' NOT NULL,
	"answer" text,
	"answered_at" timestamp with time zone,
	CONSTRAINT "listing_requests_status" CHECK ("listing_requests"."status" in ('received', 'listed', 'on_hold', 'refused'))
);
