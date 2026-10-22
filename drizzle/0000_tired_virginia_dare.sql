CREATE TABLE `exam_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`exam_id` int NOT NULL,
	`level_id` int NOT NULL,
	`status` varchar(30) NOT NULL DEFAULT 'in_progress',
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`submitted_at` timestamp,
	`expires_at` timestamp,
	`score_percent` int,
	`points_earned` int,
	`points_possible` int,
	`passed` boolean,
	`snapshot` json,
	`answers` json,
	CONSTRAINT `exam_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`level_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`bank_id` int,
	`question_count` int NOT NULL DEFAULT 10,
	`shuffle_questions` boolean NOT NULL DEFAULT true,
	`shuffle_options` boolean NOT NULL DEFAULT true,
	`time_limit_minutes` int NOT NULL DEFAULT 30,
	`passing_score` int NOT NULL DEFAULT 70,
	`max_attempts` int NOT NULL DEFAULT 3,
	`is_published` boolean NOT NULL DEFAULT true,
	CONSTRAINT `exams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lesson_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`lesson_id` int NOT NULL,
	`completed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lesson_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `lesson_progress_user_lesson` UNIQUE(`user_id`,`lesson_id`)
);
--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`level_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL DEFAULT (''),
	`cover_filename` text,
	`video_url` text,
	`embed_code` text,
	`sort_order` int NOT NULL DEFAULT 0,
	`is_published` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lessons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `level_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`level_id` int NOT NULL,
	`status` varchar(30) NOT NULL DEFAULT 'locked',
	`unlocked_at` timestamp,
	`study_deadline` timestamp,
	`exam_deadline` timestamp,
	`passed_at` timestamp,
	`best_score` int,
	`attempts_used` int NOT NULL DEFAULT 0,
	CONSTRAINT `level_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `level_progress_user_level` UNIQUE(`user_id`,`level_id`)
);
--> statement-breakpoint
CREATE TABLE `levels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`number` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`cover_filename` text,
	`required_score` int NOT NULL DEFAULT 70,
	`study_days` int NOT NULL DEFAULT 7,
	`exam_days` int NOT NULL DEFAULT 3,
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `levels_id` PRIMARY KEY(`id`),
	CONSTRAINT `levels_number_unique` UNIQUE(`number`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`amount_cents` int NOT NULL,
	`reference_number` varchar(100) NOT NULL,
	`receipt_path` text NOT NULL,
	`purpose` varchar(30) NOT NULL DEFAULT 'registration',
	`status` varchar(30) NOT NULL DEFAULT 'pending',
	`notes` text,
	`admin_note` text,
	`submitted_at` timestamp NOT NULL DEFAULT (now()),
	`reviewed_at` timestamp,
	`reviewed_by` int,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `question_banks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`level_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `question_banks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bank_id` int NOT NULL,
	`type` varchar(40) NOT NULL,
	`prompt` text NOT NULL,
	`options` json,
	`correct_answer` json,
	`points` int NOT NULL DEFAULT 1,
	`explanation` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`token` varchar(128) NOT NULL,
	`user_id` int NOT NULL,
	`expires_at` timestamp NOT NULL,
	CONSTRAINT `sessions_token` PRIMARY KEY(`token`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`academy_name` varchar(255) NOT NULL,
	`tagline` text,
	`announcement` text,
	`registration_fee_cents` int NOT NULL DEFAULT 15000,
	`currency` varchar(10) NOT NULL DEFAULT 'PHP',
	`bank_name` varchar(255),
	`account_name` varchar(255),
	`account_number` varchar(100),
	`payment_instructions` text,
	`retake_fee_cents` int NOT NULL DEFAULT 9500,
	`reinstatement_fee_cents` int NOT NULL DEFAULT 12500,
	`time_zone` varchar(80) NOT NULL DEFAULT 'UTC',
	`logo_filename` varchar(255),
	`favicon_filename` varchar(255),
	`exam_note` text,
	`landing_content` json,
	`registration_form` json,
	`google_maps_api_key` varchar(255),
	`demo_seed_version` int NOT NULL DEFAULT 0,
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` text NOT NULL,
	`full_name` varchar(255) NOT NULL,
	`phone` varchar(50),
	`address` text,
	`education` text,
	`latitude` varchar(40),
	`longitude` varchar(40),
	`registration_answers` json,
	`registration_details` text,
	`profile_bio` text,
	`profile_photo` text,
	`cover_photo` text,
	`professional_headline` varchar(180),
	`resume_summary` text,
	`skills` text,
	`experience` text,
	`birth_date` date,
	`role` varchar(20) NOT NULL DEFAULT 'student',
	`account_status` varchar(40) NOT NULL DEFAULT 'pending_payment',
	`guide_completed_at` timestamp,
	`password_changed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `exam_attempts` ADD CONSTRAINT `exam_attempts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exam_attempts` ADD CONSTRAINT `exam_attempts_exam_id_exams_id_fk` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exams` ADD CONSTRAINT `exams_level_id_levels_id_fk` FOREIGN KEY (`level_id`) REFERENCES `levels`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exams` ADD CONSTRAINT `exams_bank_id_question_banks_id_fk` FOREIGN KEY (`bank_id`) REFERENCES `question_banks`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lesson_progress` ADD CONSTRAINT `lesson_progress_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lesson_progress` ADD CONSTRAINT `lesson_progress_lesson_id_lessons_id_fk` FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lessons` ADD CONSTRAINT `lessons_level_id_levels_id_fk` FOREIGN KEY (`level_id`) REFERENCES `levels`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `level_progress` ADD CONSTRAINT `level_progress_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `level_progress` ADD CONSTRAINT `level_progress_level_id_levels_id_fk` FOREIGN KEY (`level_id`) REFERENCES `levels`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_reviewed_by_users_id_fk` FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `question_banks` ADD CONSTRAINT `question_banks_level_id_levels_id_fk` FOREIGN KEY (`level_id`) REFERENCES `levels`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `questions` ADD CONSTRAINT `questions_bank_id_question_banks_id_fk` FOREIGN KEY (`bank_id`) REFERENCES `question_banks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;