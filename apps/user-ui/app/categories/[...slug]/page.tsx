// import { CATEGORY_STATE_MAP } from "@/data/departments";
import { DEPARTMENTS_DATA } from "@/shared/utils/lib";
import { CATEGORY_STATE_MAP } from "@/shared/utils/tools";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const paths: Array<{ slug: string[] }> = [];

  const extractPaths = (item: any) => {
    if (item.href && item.href.startsWith('/categories/')) {
      // Convert "/categories/fashion/mens" into ["fashion", "mens"]
      const slugArray = item.href.replace('/categories/', '').split('/');
      paths.push({ slug: slugArray });
    }
    if (item.categories) item.categories.forEach(extractPaths);
    if (item.subcategories) item.subcategories.forEach(extractPaths);
  };

  DEPARTMENTS_DATA.forEach(extractPaths);
  return paths;
}

export default async function CategoryPage({ params }: any) {
  const { slug } = await params;
  
  // Reconstruct the expected lookup path key
  const currentPath = `/categories/${slug.join("/")}`;
  const categoryData = CATEGORY_STATE_MAP[currentPath];

  // If the path doesn't exist in our global map state, hit the 404 page
  if (!categoryData) {
    notFound();
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-4">{categoryData.name}</h1>
      <p className="text-muted-foreground">
        Browsing items mapped directly under: <code className="bg-slate-100 p-1">{currentPath}</code>
      </p>
      {/* Fetch or filter products belonging to this category key here */}
    </main>
  );
}