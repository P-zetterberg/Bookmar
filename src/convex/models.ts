import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const get = query({
	args: {},
	handler: async (ctx) => {
		const models = await ctx.db.query('models').collect();
		return models;
	}
});

export const create = mutation({
	args: {
		name: v.string(),
		url: v.string()
	},
	handler: async (ctx, args) => {
		const modelId = await ctx.db.insert('models', {
			name: args.name,
			url: args.url
		});
		return modelId;
	}
});
