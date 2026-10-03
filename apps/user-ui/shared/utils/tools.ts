import { DEPARTMENTS_DATA } from "./lib";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const generateCategoryState = (data: typeof DEPARTMENTS_DATA) => {
  const lookup: Record<string, FlatCategory> = {};

  const traverse = (item: any, currentBreadcrumbs: Array<{ name: string; href: string }> = []) => {
    const itemName = item.name || item.label;
    
    // Create new breadcrumb trail for this node level
    const updatedBreadcrumbs = item.href && itemName !== 'All Departments' 
      ? [...currentBreadcrumbs, { name: itemName, href: item.href }]
      : currentBreadcrumbs;

    if (item.href) {
      lookup[item.href] = {
        name: itemName,
        href: item.href,
        breadcrumbs: updatedBreadcrumbs
      };
    }

    if (item.categories) item.categories.forEach((child: any) => traverse(child, updatedBreadcrumbs));
    if (item.subcategories) item.subcategories.forEach((child: any) => traverse(child, updatedBreadcrumbs));
  };

  data.forEach(dept => traverse(dept));
  return lookup;
};

// Your globally accessible state lookup map
export const CATEGORY_STATE_MAP = generateCategoryState(DEPARTMENTS_DATA);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const currentCategory = CATEGORY_STATE_MAP['/categories/fashion/mens/tops/t-shirts'];

console.log(currentCategory.name); 
// Output: "T-Shirts"

console.log(currentCategory.breadcrumbs);
// Output: 
// [
//   { name: "Fashion & Apparel", href: "/categories/fashion" },
//   { name: "Men's Clothing", href: "/categories/fashion/mens" },
//   { name: "Tops & Shirts", href: "/categories/fashion/mens/tops" },
//   { name: "T-Shirts", href: "/categories/fashion/mens/tops/t-shirts" }
// ]