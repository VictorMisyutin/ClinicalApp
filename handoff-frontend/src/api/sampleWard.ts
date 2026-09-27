import type {
  Clinician,
  Handoff,
  HandoffRecord,
  Patient,
  Shift,
} from '@/types/domain';

/**
 * A fictional ward used to develop and demo the UI before the API is wired up.
 * No real patient data appears here and none ever should.
 */

const UNIT = '6 West — Medical/Surgical';

function at(hourOffset: number): string {
  return new Date(Date.now() + hourOffset * 60 * 60 * 1000).toISOString();
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export const shift: Shift = {
  unit: UNIT,
  label: 'Night → Day',
  changeoverAt: at(1.75),
};

export const clinicians: Clinician[] = [
  { id: 'c-1', name: 'A. Okonkwo', role: 'RN', unit: UNIT },
  { id: 'c-2', name: 'D. Halvorsen', role: 'RN', unit: UNIT },
  { id: 'c-3', name: 'R. Mehta', role: 'Charge RN', unit: UNIT },
  { id: 'c-4', name: 'S. Baptiste', role: 'Resident', unit: UNIT },
  { id: 'c-5', name: 'J. Fairweather', role: 'NP', unit: UNIT },
];

/**
 * Employee IDs for the sample-ward sign-in stand-in. There is no real backend
 * to check a password against in this mode, so any non-empty password is
 * accepted — this exists only so the sign-in form has the same shape it will
 * have against the real API.
 */
export const demoEmployeeIds: Record<string, string> = {
  aokonkwo: 'c-1',
  dhalvorsen: 'c-2',
  rmehta: 'c-3',
  sbaptiste: 'c-4',
  jfairweather: 'c-5',
};

interface Seed {
  patient: Omit<Patient, 'unit'>;
  handoff: Omit<
    Handoff,
    | 'id'
    | 'patientId'
    | 'shiftLabel'
    | 'updatedAt'
    | 'submittedAt'
    | 'acknowledgedAt'
    | 'incomingClinician'
    | 'synthesis'
    | 'actionListReviewed'
  > &
    Partial<Pick<Handoff, 'submittedAt' | 'incomingClinician' | 'synthesis'>>;
}

const seeds: Seed[] = [
  {
    patient: {
      id: 'p-1',
      mrn: '4471902',
      familyName: 'Whitfield',
      givenName: 'Marcus',
      ageYears: 68,
      sex: 'M',
      room: '612A',
      admittedOn: daysAgo(3),
    },
    handoff: {
      status: 'submitted',
      severity: 'unstable',
      summary:
        'Day 2 after right hemicolectomy. Febrile to 38.9 at 03:10 with a rising lactate of 3.1 and a heart rate in the 120s. Blood cultures drawn, broad-spectrum antibiotics started at 03:40, and 1.5 L crystalloid given with a modest pressure response. Surgery aware and reviewing this morning.',
      codeStatus: 'full',
      allergies: 'Penicillin — anaphylaxis. Contrast dye — rash.',
      noKnownDrugAllergies: false,
      actions: [
        {
          id: 'a-1',
          task: 'Repeat lactate and full blood count',
          owner: 'A. Okonkwo',
          dueAt: at(-0.6),
          priority: 'now',
          completed: false,
        },
        {
          id: 'a-2',
          task: 'Hourly urine output, escalate if under 30 mL/h for two hours',
          owner: 'A. Okonkwo',
          dueAt: at(0.5),
          priority: 'now',
          completed: false,
        },
        {
          id: 'a-3',
          task: 'Chase surgical review before the ward round',
          owner: 'S. Baptiste',
          dueAt: at(2),
          priority: 'before-rounds',
          completed: false,
        },
      ],
      pendingStudies: [
        { id: 's-1', study: 'Blood cultures ×2, drawn 03:15', followUpOwner: 'S. Baptiste' },
        { id: 's-2', study: 'CT abdomen with contrast — alternative agent ordered', followUpOwner: 'S. Baptiste' },
      ],
      contingencies: [
        {
          id: 'g-1',
          ifCondition: 'Systolic pressure stays below 90 after a 500 mL bolus',
          thenAction: 'Call the medical emergency team and alert the intensivist on call',
        },
        {
          id: 'g-2',
          ifCondition: 'Lactate climbs above 4',
          thenAction: 'Escalate to the surgical registrar directly, do not wait for rounds',
        },
      ],
      outgoingClinician: 'D. Halvorsen',
      submittedAt: at(-0.3),
    },
  },
  {
    patient: {
      id: 'p-2',
      mrn: '4468120',
      familyName: 'Adeyemi',
      givenName: 'Grace',
      ageYears: 74,
      sex: 'F',
      room: '614B',
      admittedOn: daysAgo(6),
    },
    handoff: {
      status: 'submitted',
      severity: 'watcher',
      summary:
        'Community acquired pneumonia, now on day 4 of antibiotics. Oxygen requirement came down from 4 L to 2 L overnight but she desaturates to 88 percent on exertion. Eating poorly and slightly confused at night, which is new since Tuesday.',
      codeStatus: 'dnr',
      allergies: '',
      noKnownDrugAllergies: true,
      actions: [
        {
          id: 'a-4',
          task: 'Wean oxygen as tolerated, target saturation 92 to 96 percent',
          owner: 'A. Okonkwo',
          dueAt: at(3),
          priority: 'this-shift',
          completed: false,
        },
        {
          id: 'a-5',
          task: 'Delirium screen and a note on overnight orientation',
          owner: 'A. Okonkwo',
          dueAt: at(1.2),
          priority: 'before-rounds',
          completed: false,
        },
      ],
      pendingStudies: [
        { id: 's-3', study: 'Repeat chest film ordered for this morning', followUpOwner: 'J. Fairweather' },
      ],
      contingencies: [
        {
          id: 'g-3',
          ifCondition: 'Oxygen need goes back above 4 L',
          thenAction: 'Call the resident and reassess for effusion, family already know she is not for intubation',
        },
      ],
      outgoingClinician: 'D. Halvorsen',
      submittedAt: at(-0.25),
    },
  },
  {
    patient: {
      id: 'p-3',
      mrn: '4472551',
      familyName: 'Nkemelu',
      givenName: 'Chidi',
      ageYears: 41,
      sex: 'M',
      room: '616A',
      admittedOn: daysAgo(1),
    },
    handoff: {
      status: 'draft',
      severity: 'watcher',
      summary:
        'Admitted yesterday evening with severe pancreatitis, likely gallstone in origin. Pain is settling on a patient controlled pump. Tolerating sips only.',
      codeStatus: 'full',
      allergies: 'Codeine — vomiting.',
      noKnownDrugAllergies: false,
      actions: [
        {
          id: 'a-6',
          task: 'Four hourly pain scores, review pump use at 08:00',
          owner: '',
          dueAt: at(2.5),
          priority: 'this-shift',
          completed: false,
        },
      ],
      pendingStudies: [
        { id: 's-4', study: 'Ultrasound of the biliary tree', followUpOwner: '' },
      ],
      contingencies: [],
      outgoingClinician: 'D. Halvorsen',
    },
  },
  {
    patient: {
      id: 'p-4',
      mrn: '4470033',
      familyName: 'Sørensen',
      givenName: 'Britt',
      ageYears: 59,
      sex: 'F',
      room: '618A',
      admittedOn: daysAgo(2),
    },
    handoff: {
      status: 'submitted',
      severity: 'stable',
      summary:
        'Cellulitis of the left lower leg, improving on intravenous antibiotics. The marked border has receded by roughly two centimetres since yesterday and she is walking to the bathroom without help. Likely discharge tomorrow if the oral switch holds.',
      codeStatus: 'full',
      allergies: '',
      noKnownDrugAllergies: true,
      actions: [
        {
          id: 'a-7',
          task: 'Re-mark the erythema border and photograph for the chart',
          owner: 'A. Okonkwo',
          dueAt: at(4),
          priority: 'this-shift',
          completed: false,
        },
      ],
      pendingStudies: [],
      contingencies: [],
      outgoingClinician: 'D. Halvorsen',
      submittedAt: at(-0.4),
    },
  },
  {
    patient: {
      id: 'p-5',
      mrn: '4469887',
      familyName: 'Castellanos',
      givenName: 'Rafael',
      ageYears: 83,
      sex: 'M',
      room: '620B',
      admittedOn: daysAgo(9),
    },
    handoff: {
      status: 'submitted',
      severity: 'watcher',
      summary:
        'Fractured neck of femur repaired on day 2, now day 9 with a slow recovery. Delirium in the evenings and two unwitnessed falls this admission. Physiotherapy going well in the mornings only. Family meeting about placement is booked for this afternoon.',
      codeStatus: 'dnr-dni',
      allergies: 'Sulfa drugs — rash.',
      noKnownDrugAllergies: false,
      actions: [
        {
          id: 'a-8',
          task: 'Falls precautions checked at the start of the shift, bed low and alarm on',
          owner: 'A. Okonkwo',
          dueAt: at(0.4),
          priority: 'now',
          completed: false,
        },
        {
          id: 'a-9',
          task: 'Have the family meeting summary ready for the 14:00 conversation',
          owner: 'R. Mehta',
          dueAt: at(6),
          priority: 'this-shift',
          completed: false,
        },
        {
          id: 'a-10',
          task: 'Morning physiotherapy session confirmed',
          owner: 'A. Okonkwo',
          dueAt: at(-2),
          priority: 'this-shift',
          completed: true,
        },
      ],
      pendingStudies: [],
      contingencies: [
        {
          id: 'g-4',
          ifCondition: 'He becomes agitated and tries to climb out of bed',
          thenAction: 'Non-drug settling first, family photo board at the bedside, call the resident before any sedation',
        },
      ],
      outgoingClinician: 'D. Halvorsen',
      submittedAt: at(-0.2),
    },
  },
  {
    patient: {
      id: 'p-6',
      mrn: '4473104',
      familyName: 'Lindqvist',
      givenName: 'Tove',
      ageYears: 29,
      sex: 'F',
      room: '622A',
      admittedOn: daysAgo(1),
    },
    handoff: {
      status: 'draft',
      severity: null,
      summary: '',
      codeStatus: 'unconfirmed',
      allergies: '',
      noKnownDrugAllergies: false,
      actions: [],
      pendingStudies: [],
      contingencies: [],
      outgoingClinician: 'D. Halvorsen',
    },
  },
  {
    patient: {
      id: 'p-7',
      mrn: '4465210',
      familyName: 'Oyelaran',
      givenName: 'Femi',
      ageYears: 55,
      sex: 'M',
      room: '624B',
      admittedOn: daysAgo(4),
    },
    handoff: {
      status: 'acknowledged',
      severity: 'stable',
      summary:
        'Diabetic ketoacidosis resolved on day one and he has been on a subcutaneous regimen since. Sugars have sat between 7 and 11 for a full day. The diabetes nurse educator has seen him twice and he is comfortable with the pen technique.',
      codeStatus: 'full',
      allergies: '',
      noKnownDrugAllergies: true,
      actions: [
        {
          id: 'a-11',
          task: 'Pre-meal glucose checks, no sliding scale needed',
          owner: 'A. Okonkwo',
          dueAt: at(3.5),
          priority: 'this-shift',
          completed: false,
        },
      ],
      pendingStudies: [],
      contingencies: [],
      outgoingClinician: 'D. Halvorsen',
      incomingClinician: 'A. Okonkwo',
      synthesis:
        'Stable diabetic, off the insulin infusion, pre-meal checks only and no sliding scale. Discharge teaching is done. I will chase the pharmacy script this morning.',
      submittedAt: at(-0.8),
    },
  },
  {
    patient: {
      id: 'p-8',
      mrn: '4471445',
      familyName: 'Brennan',
      givenName: 'Aoife',
      ageYears: 36,
      sex: 'F',
      room: '626A',
      admittedOn: daysAgo(2),
    },
    handoff: {
      status: 'submitted',
      severity: 'stable',
      summary:
        'Admitted for intravenous rehydration after two days of vomiting from a viral gastroenteritis. She has kept fluids down since midnight and the electrolytes corrected overnight. Home today once she manages a light breakfast.',
      codeStatus: 'full',
      allergies: 'Latex — contact dermatitis.',
      noKnownDrugAllergies: false,
      actions: [
        {
          id: 'a-12',
          task: 'Trial of a light breakfast, then discharge paperwork if she tolerates it',
          owner: 'A. Okonkwo',
          dueAt: at(2.2),
          priority: 'before-rounds',
          completed: false,
        },
      ],
      pendingStudies: [],
      contingencies: [],
      outgoingClinician: 'D. Halvorsen',
      submittedAt: at(-0.35),
    },
  },
];

export function buildWard(): HandoffRecord[] {
  return seeds.map(({ patient, handoff }, index) => ({
    patient: { ...patient, unit: UNIT },
    handoff: {
      id: `h-${index + 1}`,
      patientId: patient.id,
      shiftLabel: shift.label,
      updatedAt: at(-0.5),
      submittedAt: handoff.submittedAt ?? null,
      acknowledgedAt: handoff.status === 'acknowledged' ? at(-0.7) : null,
      incomingClinician: handoff.incomingClinician ?? '',
      synthesis: handoff.synthesis ?? '',
      actionListReviewed: handoff.status === 'acknowledged',
      ...handoff,
    } as Handoff,
  }));
}
