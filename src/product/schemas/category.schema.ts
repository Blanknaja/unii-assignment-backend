import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class SubCategory {
  @Prop({ required: true }) subCategoryId: string;
  @Prop({ required: true }) subCategoryName: string;
}

@Schema({ timestamps: true })
export class Category extends Document {
  @Prop({ required: true, index: true }) categoryId: string;
  @Prop({ required: true }) categoryName: string;
  @Prop({ type: [SubCategory], default: [] }) subcategory: SubCategory[];
}

export const CategorySchema = SchemaFactory.createForClass(Category);
