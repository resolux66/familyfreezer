export type ApplianceType = 'freezer' | 'fridge';

export interface Compartment {
  id: string;
  label: string;
  order: number;
}

export interface Appliance {
  $id: string;
  householdId: string;
  name: string;
  type: ApplianceType;
  compartments: Compartment[];
  createdAt: string;
}

export interface CreateApplianceInput {
  name: string;
  type: ApplianceType;
  compartments: Omit<Compartment, 'id'>[];
}
