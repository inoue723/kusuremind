CREATE TABLE `medication_schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`medication_id` text NOT NULL,
	`time` text NOT NULL,
	`days` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`medication_id`) REFERENCES `medications`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `medication_taking_records` (
	`id` text PRIMARY KEY NOT NULL,
	`medication_id` text NOT NULL,
	`medication_schedule_id` text NOT NULL,
	`scheduled_date` text NOT NULL,
	`consumed_at` integer NOT NULL,
	FOREIGN KEY (`medication_id`) REFERENCES `medications`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`medication_schedule_id`) REFERENCES `medication_schedules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `medications` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
