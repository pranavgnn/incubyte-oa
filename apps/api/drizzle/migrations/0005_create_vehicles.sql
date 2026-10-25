CREATE TYPE "public"."vehicle_category" AS ENUM('sedan', 'suv', 'hatchback', 'coupe', 'convertible', 'truck', 'van', 'electric');--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"category" "vehicle_category" NOT NULL,
	"price" integer NOT NULL,
	"quantity" integer NOT NULL,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
