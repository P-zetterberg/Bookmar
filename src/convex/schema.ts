import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	links: defineTable({
		favicon: v.string(),
		tags: v.array(v.string()),
		title: v.string(),
		url: v.string()
	}),
	models: defineTable({
		name: v.string(),
		url: v.string()
	})
});
