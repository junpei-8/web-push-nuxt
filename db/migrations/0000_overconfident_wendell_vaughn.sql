CREATE TABLE `web_push_registrations` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`endpoint` text NOT NULL,
	`auth_key` text NOT NULL,
	`p256dh_key` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `web_push_registrations_id` PRIMARY KEY(`id`),
	CONSTRAINT `ui_web_push_registrations_endpoint` UNIQUE(`endpoint`)
);
