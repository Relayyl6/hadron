import { PrismaClient } from '@prisma/client';
// import { DEPARTMENTS_DATA } from "./path-to-your-departments-data"; // Update this path!
import { DEPARTMENTS_DATA } from './data';

const prisma = new PrismaClient();

const initialiseConfig = async () => {
  try {
    const existingConfig = await prisma.site_configs.findFirst();

    if (!existingConfig) {
      // 1. Filter out the 'all-departments' object, as it's just a routing wrapper
      const mainDepartments = DEPARTMENTS_DATA.filter(
        (dep) => dep.id !== 'all-departments',
      );

      // 2. Extract just the main labels for the `categories` String[] array
      // Result: ["Electronics & Gadgets", "Fashion & Apparel", ...]
      const categoryNames = mainDepartments.map((dep) => dep.label);

      // 3. Build a clean JSON object mapping the main category to its nested subcategories
      const subCategoriesMap = mainDepartments.reduce(
        (acc, department) => {
          // We use the department label as the key, and store its categories array as the value
          acc[department.label] = department.categories;
          return acc;
        },
        {} as Record<string, any>,
      );

      // 4. Save to the database
      await prisma.site_configs.create({
        data: {
          categories: categoryNames,
          subCategories: subCategoriesMap,
        },
      });

      console.log('Database configuration initialized successfully!');
    } else {
      console.log('Configuration already exists, skipping initialization.');
    }
  } catch (error) {
    console.error('Error initializing site configuration:', error);
  } finally {
    await prisma.$disconnect();
  }
};

// Execute the function if you are running this file directly
export default initialiseConfig;
