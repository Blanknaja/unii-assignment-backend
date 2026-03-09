export interface SubCategoryResponse {
  subCategoryId: string;
  subCategoryName: string;
}

export interface CategoryResponse {
  categoryId: string;
  categoryName: string;
  subcategory: SubCategoryResponse[];
}
