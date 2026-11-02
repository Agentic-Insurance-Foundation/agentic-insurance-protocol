CREATE TABLE "partner_requests" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "partner_requests_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"title" text NOT NULL,
	"email" text NOT NULL,
	"company" text NOT NULL,
	"size" text NOT NULL,
	"type" text NOT NULL,
	"message" text,
	"contact_name" text,
	"contact_email" text
);
