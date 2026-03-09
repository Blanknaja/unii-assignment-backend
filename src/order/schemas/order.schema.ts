import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
class TransactionPartyDetail {
  @Prop() roleName: string;
  @Prop() name: string;
  @Prop() id: string;
}

@Schema({ _id: false })
class TransactionParties {
  @Prop({ type: TransactionPartyDetail }) customer: TransactionPartyDetail;
  @Prop({ type: TransactionPartyDetail }) transport: TransactionPartyDetail;
  @Prop({ type: TransactionPartyDetail }) collector: TransactionPartyDetail;
}

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ required: true, index: true }) orderId: string;
  @Prop({ required: true, enum: ['BUY', 'SELL'], index: true })
  orderType: string;
  @Prop({ type: TransactionParties, default: null })
  transactionParties: TransactionParties;
  @Prop({ required: true }) orderFinishedDate: string;
  @Prop() orderFinishedTime: string;
  @Prop({ type: Array, default: [] }) requestList: any[];
}

export const OrderSchema = SchemaFactory.createForClass(Order);
