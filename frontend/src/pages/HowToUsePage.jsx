import PageHeader from '../components/PageHeader.jsx';
import '../css/HowToUsePage.css';

const STEPS = [
  {
    title: 'Log your pet\u2019s day',
    items: [
      'Open the Log page and fill in your pet\u2019s name, species, and the date.',
      'Add how much food and water they had, their activity in minutes, and their weight.',
      'Tick any symptoms you noticed, then press Save.',
      'Made a mistake? Open History to edit or delete an entry, or filter by pet, date range, or symptom to show your vet.',
    ],
  },
  {
    title: 'Read your alerts',
    items: [
      'The Alerts page lists days that look off compared to that pet\u2019s own normal.',
      'Each alert shows what changed and the chance that it needs attention.',
      'Press Real problem or False alarm so the model gets better for your pet over time.',
    ],
  },
  {
    title: 'Manage pets and care',
    items: [
      'On the Pets page, add each pet once with their breed, birth date, weight, and vet details.',
      'On the Care page, add tasks like medications, vaccines, and vet visits with a due date and an optional repeat.',
      'Overdue tasks show first, then upcoming ones. Press Mark done to check one off. Repeating tasks create the next one for you.',
    ],
  },
];

export default function HowToUsePage() {
  return (
    <div className="howto-page">
      <PageHeader
        eyebrow="Getting started"
        title="How to use PawLog"
        subtitle="Three steps to keep an eye on your pet's health."
      />

      <ol className="howto-steps">
        {STEPS.map((step) => (
          <li key={step.title} className="howto-step">
            <h2>{step.title}</h2>
            <ul>
              {step.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <p className="howto-note">
        PawLog is not veterinary advice. Alerts are only a nudge to look closer.
        If your pet seems unwell, call your vet.
      </p>
    </div>
  );
}
