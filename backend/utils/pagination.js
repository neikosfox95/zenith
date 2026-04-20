/**
 * Sprint 2 Phase 2: Pagination & Search Utilities
 * Provides reusable pagination and search helpers for all API endpoints
 */

/**
 * Parse pagination parameters from request query
 * @param {Object} query - Express request query object
 * @returns {Object} Parsed pagination parameters
 */
export function parsePaginationParams(query) {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 20, 100); // Max 100 items per page
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
}

/**
 * Parse sort parameters from request query
 * @param {Object} query - Express request query object
 * @param {String} defaultSort - Default sort field
 * @returns {Object} MongoDB sort object
 */
export function parseSortParams(query, defaultSort = '-createdAt') {
  const sortBy = query.sortBy || defaultSort;
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
  
  // Handle special case: "-fieldName" means descending
  if (sortBy.startsWith('-')) {
    const field = sortBy.substring(1);
    return { [field]: -1 };
  }
  
  return { [sortBy]: sortOrder };
}

/**
 * Build MongoDB filter object from search parameters
 * @param {Object} query - Express request query object
 * @param {Array} searchFields - Fields to search in
 * @returns {Object} MongoDB filter object
 */
export function buildSearchFilter(query, searchFields = []) {
  const filter = {};
  
  // Text search
  if (query.search && searchFields.length > 0) {
    // Use $text index if available, otherwise use $or with regex
    if (query.useTextIndex) {
      filter.$text = { $search: query.search };
    } else {
      filter.$or = searchFields.map(field => ({
        [field]: { $regex: query.search, $options: 'i' }
      }));
    }
  }
  
  // Date range filters
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) {
      filter.createdAt.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      filter.createdAt.$lte = new Date(query.endDate);
    }
  }
  
  // Status filter
  if (query.status) {
    filter.status = query.status;
  }
  
  // Type filter
  if (query.type) {
    filter.type = query.type;
  }
  
  // Model filter (for AI requests)
  if (query.model) {
    filter.model = query.model;
  }
  
  // Language filter
  if (query.language) {
    filter.language = query.language;
  }
  
  // User ID filter
  if (query.userId) {
    filter.userId = query.userId;
  }
  
  // Creator ID filter
  if (query.creatorId) {
    filter.creator_id = query.creatorId;
  }
  
  return filter;
}

/**
 * Format paginated response
 * @param {Array} data - Array of documents
 * @param {Number} total - Total count of documents
 * @param {Number} page - Current page number
 * @param {Number} limit - Items per page
 * @returns {Object} Formatted pagination response
 */
export function formatPaginatedResponse(data, total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null
    }
  };
}

/**
 * Advanced search with full-text search and filters
 * @param {Object} collection - MongoDB collection
 * @param {Object} query - Express request query object
 * @param {Array} searchFields - Fields to search in
 * @param {Object} additionalFilter - Additional filter conditions
 * @returns {Promise<Object>} Paginated search results
 */
export async function advancedSearch(collection, query, searchFields = [], additionalFilter = {}) {
  const { page, limit, skip } = parsePaginationParams(query);
  const sort = parseSortParams(query);
  const searchFilter = buildSearchFilter(query, searchFields);
  
  // Combine filters
  const filter = { ...searchFilter, ...additionalFilter };
  
  // Execute query with pagination
  const [data, total] = await Promise.all([
    collection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray(),
    collection.countDocuments(filter)
  ]);
  
  return formatPaginatedResponse(data, total, page, limit);
}

/**
 * Faceted search with aggregation
 * @param {Object} collection - MongoDB collection
 * @param {Object} query - Express request query object
 * @param {Array} facets - Facet fields
 * @returns {Promise<Object>} Search results with facets
 */
export async function facetedSearch(collection, query, facets = []) {
  const { page, limit, skip } = parsePaginationParams(query);
  const sort = parseSortParams(query);
  const filter = buildSearchFilter(query);
  
  const pipeline = [
    { $match: filter },
    {
      $facet: {
        // Main results
        results: [
          { $sort: sort },
          { $skip: skip },
          { $limit: limit }
        ],
        // Total count
        totalCount: [
          { $count: 'count' }
        ],
        // Facets
        ...facets.reduce((acc, facet) => {
          acc[`${facet}Facets`] = [
            { $group: { _id: `$${facet}`, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ];
          return acc;
        }, {})
      }
    }
  ];
  
  const result = await collection.aggregate(pipeline).toArray();
  const aggregated = result[0];
  
  const total = aggregated.totalCount[0]?.count || 0;
  const data = aggregated.results;
  
  // Extract facets
  const facetResults = {};
  facets.forEach(facet => {
    facetResults[facet] = aggregated[`${facet}Facets`];
  });
  
  return {
    ...formatPaginatedResponse(data, total, page, limit),
    facets: facetResults
  };
}

/**
 * Auto-complete search
 * @param {Object} collection - MongoDB collection
 * @param {String} query - Search query
 * @param {Array} fields - Fields to search in
 * @param {Number} limit - Max results
 * @returns {Promise<Array>} Auto-complete suggestions
 */
export async function autoComplete(collection, query, fields = [], limit = 10) {
  if (!query || query.length < 2) {
    return [];
  }
  
  const filter = {
    $or: fields.map(field => ({
      [field]: { $regex: `^${query}`, $options: 'i' }
    }))
  };
  
  const results = await collection
    .find(filter)
    .limit(limit)
    .toArray();
  
  return results;
}
