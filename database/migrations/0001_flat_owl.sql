DROP TABLE `web_push_subscriptions`;
--> statement-breakpoint
CREATE TABLE `web_push_subscriptions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`endpoint` varchar(768) NOT NULL,
	`auth_key` text NOT NULL,
	`p256dh_key` text NOT NULL,
	`expired_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `web_push_subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `web_push_subscriptions_endpoint_unique` UNIQUE(`endpoint`)
);
--> statement-breakpoint
DROP TABLE `web_push_registrations`;