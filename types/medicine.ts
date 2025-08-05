export interface Medicine {
    id: string;
    name: string;
    brand: string;
    description: string;
    type: string;
    dosageForm: string;
    size: string;
    stock: number;
    recommended: boolean;
    image?: string;
    createdAt: string;
    updatedAt: string;
  }