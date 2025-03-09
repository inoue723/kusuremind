PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_medication_taking_records` (
	`medication_schedule_id` text NOT NULL,
	`scheduled_date` text NOT NULL,
	`consumed_at` integer NOT NULL,
	PRIMARY KEY(`medication_schedule_id`, `scheduled_date`),
	FOREIGN KEY (`medication_schedule_id`) REFERENCES `medication_schedules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_medication_taking_records`("medication_schedule_id", "scheduled_date", "consumed_at") SELECT "medication_schedule_id", "scheduled_date", "consumed_at" FROM `medication_taking_records`;--> statement-breakpoint
DROP TABLE `medication_taking_records`;--> statement-breakpoint
ALTER TABLE `__new_medication_taking_records` RENAME TO `medication_taking_records`;--> statement-breakpoint
PRAGMA foreign_keys=ON;