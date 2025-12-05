import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const get = query({
	args: {},
	handler: async (ctx) => {
		const links = await ctx.db.query('links').collect();
		return links;
	}
});

export const create = mutation({
	args: {
		url: v.string(),
		title: v.string(),
		tags: v.array(v.string()),
		favicon: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const linkId = await ctx.db.insert('links', {
			url: args.url,
			title: args.title,
			tags: args.tags,
			favicon: args.favicon || ''
		});
		return linkId;
	}
});
