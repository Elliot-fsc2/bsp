CREATE TABLE `program_sections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`age_range` varchar(80),
	`position` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `program_sections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `programs` ADD `section_id` int;--> statement-breakpoint
ALTER TABLE `programs` ADD CONSTRAINT `programs_section_id_program_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `program_sections`(`id`) ON DELETE no action ON UPDATE no action;