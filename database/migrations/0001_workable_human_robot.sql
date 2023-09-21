RENAME TABLE `web_push_registrations` TO `web_push_subscriptions`;--> statement-breakpoint
ALTER TABLE `web_push_subscriptions` DROP CONSTRAINT `web_push_registrations_endpoint_unique`;--> statement-breakpoint
ALTER TABLE `web_push_subscriptions` ADD `expired_at` timestamp;--> statement-breakpoint
ALTER TABLE `web_push_subscriptions` ADD CONSTRAINT `web_push_subscriptions_endpoint_unique` UNIQUE(`endpoint`);