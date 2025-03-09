import React from 'react';
import MedicationForm from '@/components/MedicationForm';
import { useMedicationForm } from '@/hooks/useMedicationForm';
import { v4 as uuidv4 } from 'uuid';

export default function AddMedicationScreen() {
  const {
    name,
    setName,
    description,
    setDescription,
    schedules,
    setSchedules,
    handleSave,
  } = useMedicationForm({ isEditing: false });

  return (
    <MedicationForm
      name={name}
      setName={setName}
      description={description}
      setDescription={setDescription}
      schedules={schedules}
      setSchedules={setSchedules}
      onSave={handleSave}
    />
  );
}