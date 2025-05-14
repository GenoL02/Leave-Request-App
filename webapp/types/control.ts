import type DatePicker from "sap/m/DatePicker";
import type Select from "sap/m/Select";
import type TextArea from "sap/m/TextArea";
import type MessageProcessor from "sap/ui/core/message/MessageProcessor";
import type PropertyBinding from "sap/ui/model/PropertyBinding";
import type SimpleType from "sap/ui/model/SimpleType";

export interface BindingTarget<T> {
  name: string;
  path: string;
  target: string;
  processor?: MessageProcessor;
  bindingType?: SimpleType;
  binding: Nullable<PropertyBinding>;
  label: string;
  data: T;
}

export type FormControl = Select | DatePicker | TextArea;
