import { convexToJson, v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { Doc, Id } from './_generated/dataModel'
import { promises } from 'dns'

export const archive = mutation({
  args: {
    id: v.id('documents'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity) {
      throw new Error('Not authenticated')
    }

    const userId = identity.subject

    const existingDocument = await ctx.db.get(args.id)

    if (!existingDocument) {
      throw new Error('Not found')
    }

    if (existingDocument.userId !== userId) {
      throw new Error('Unauthorized')
    }

    // Gets all children from parent document to be archived.
    const recursiveArchive = async (documentId: Id<'documents'>) => {
      const children = await ctx.db
        .query('documents')
        .withIndex('by_user_parent', (q) =>
          q.eq('userId', userId).eq('parentDocument', documentId),
        )
        .collect()

      // Set all child to isArchived and check if there's more children in each child (using for loop).
      // for (const child of children) {
      //   await ctx.db.patch(child._id, {
      //     isArchived: true,
      //   })
      //   await recursiveArchive(child._id)
      // }

      // Set all child to isArchived and check if there's more children in each child (using map with Promise.all()).
      children.map(async (child) => {
        await ctx.db.patch(child._id, {
          isArchived: true,
        })
        return recursiveArchive(child._id)
      })

      await Promise.all(children)
    }

    // Set parent document to isArchived.
    const document = await ctx.db.patch(args.id, {
      isArchived: true,
    })

    // Pass in parent document's id to run recursiveArchive().
    recursiveArchive(args.id)

    return document
  },
})

export const getSidebar = query({
  args: {
    parentDocument: v.optional(v.id('documents')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity) {
      throw new Error('Not authenticated')
    }

    const userId = identity.subject

    const documents = await ctx.db
      .query('documents')
      .withIndex('by_user_parent', (q) =>
        q.eq('userId', userId).eq('parentDocument', args.parentDocument),
      )
      .filter((q) => q.eq(q.field('isArchived'), false))
      .order('desc')
      .collect()

    return documents
  },
})

export const create = mutation({
  args: {
    title: v.string(),
    parentDocument: v.optional(v.id('documents')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity) {
      throw new Error('Not autheticated')
    }

    const userId = identity.subject

    const document = await ctx.db.insert('documents', {
      title: args.title,
      parentDocument: args.parentDocument,
      userId,
      isArchived: false,
      isPublished: false,
    })

    return document
  },
})

export const getTrash = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity) {
      throw new Error('Not autheticated')
    }

    const userId = identity.subject

    const documents = ctx.db
      .query('documents')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('isArchived'), true))
      .order('desc')
      .collect()

    return documents
  },
})

export const restore = mutation({
  args: { id: v.id('documents') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity) {
      throw new Error('Not authenticated')
    }

    const userId = identity.subject

    const existingDocument = await ctx.db.get(args.id)

    if (!existingDocument) {
      throw new Error('Not found')
    }

    if (existingDocument.userId !== userId) {
      throw new Error('Unauthorized')
    }

    const recursiveRestore = async (documentId: Id<'documents'>) => {
      const children = await ctx.db
        .query('documents')
        .withIndex('by_user_parent', (q) =>
          q.eq('userId', userId).eq('parentDocument', documentId),
        )
        .collect()

      // for (const child of children) {
      //   await ctx.db.patch(child._id, {
      //     isArchived: false,
      //   })

      //   await recursiveRestore(child._id)
      // }

      children.map(async (child) => {
        await ctx.db.patch(child._id, {
          isArchived: false,
        })
        await recursiveRestore(child._id)
      })

      await Promise.all(children)
    }

    const options: Partial<Doc<'documents'>> = {
      isArchived: false,
    }

    if (existingDocument.parentDocument) {
      const parent = await ctx.db.get(existingDocument.parentDocument)
      if (parent?.isArchived) {
        options.parentDocument = undefined
      }
    }

    const document = await ctx.db.patch(args.id, options)

    recursiveRestore(args.id)

    return document
  },
})

export const remove = mutation({
  args: {
    id: v.id('documents'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity) {
      throw new Error('Not authenticated')
    }

    const userId = identity.subject

    const existingDocument = await ctx.db.get(args.id)

    if (!existingDocument) {
      throw new Error('Not found')
    }

    if (existingDocument.userId !== userId) {
      throw new Error('Unauthorized')
    }

    const document = await ctx.db.delete(args.id)

    return document
  },
})

export const getSearch = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity) {
      throw new Error('Not authenticated')
    }

    const userId = identity.subject

    const documents = await ctx.db
      .query('documents')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('isArchived'), false))
      .order('desc')
      .collect()

    return documents
  },
})
