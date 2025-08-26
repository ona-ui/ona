// Exports centralisés pour tous les repositories
export { db } from './base_repository.js';
export type { PaginationOptions, PaginationResult, SortOptions } from './base_repository.js';

// Repositories
export { UserRepository } from './user_repository.js';
export { CategoryRepository } from './category_repository.js';
export { SubcategoryRepository } from './subcategory_repository.js';
export { ComponentRepository } from './component_repository.js';
export { ComponentVersionRepository } from './component_version_repository.js';
export { LicenseRepository } from './license_repository.js';

// Types
export type { ComponentFilters } from './component_repository.js';

// Instances des repositories pour injection de dépendance
import { UserRepository } from './user_repository.js';
import { CategoryRepository } from './category_repository.js';
import { SubcategoryRepository } from './subcategory_repository.js';
import { ComponentRepository } from './component_repository.js';
import { ComponentVersionRepository } from './component_version_repository.js';
import { LicenseRepository } from './license_repository.js';

export const userRepository = new UserRepository();
export const categoryRepository = new CategoryRepository();
export const subcategoryRepository = new SubcategoryRepository();
export const componentRepository = new ComponentRepository();
export const componentVersionRepository = new ComponentVersionRepository();
export const licenseRepository = new LicenseRepository();