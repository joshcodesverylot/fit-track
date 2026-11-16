// Built-in presets: three food week plans and three exercise routines.
// Sample content only — meant to be reviewed by a dietitian / physio
// before real use (see project plan).
import { db } from './db.js';

// ---------- food ----------

// item: [id, name, grams, calories, protein]
const ITEMS = [
  ['fi-oats', 'Porridge oats with milk', 240, 250, 10],
  ['fi-banana', 'Banana', 100, 90, 1],
  ['fi-toast', 'Wholemeal toast with butter', 45, 160, 4],
  ['fi-egg', 'Boiled egg', 50, 75, 7],
  ['fi-weetbix', 'Weet-Bix with milk', 180, 200, 8],
  ['fi-yoghurt', 'Plain yoghurt', 150, 120, 6],
  ['fi-greek', 'Greek yoghurt with honey', 170, 180, 12],
  ['fi-cheese-sand', 'Cheese and tomato sandwich', 180, 350, 14],
  ['fi-soup', 'Vegetable soup with a roll', 350, 280, 8],
  ['fi-tuna-salad', 'Tuna salad', 200, 250, 22],
  ['fi-chicken-sand', 'Chicken sandwich', 180, 330, 20],
  ['fi-omelette', 'Two-egg omelette', 120, 220, 14],
  ['fi-cottage', 'Cottage cheese on crackers', 120, 180, 14],
  ['fi-chicken-dinner', 'Grilled chicken, potatoes and peas', 350, 450, 35],
  ['fi-fish-dinner', 'Baked fish with rice and vegetables', 350, 420, 30],
  ['fi-mince-dinner', 'Savoury mince with vegetables', 330, 430, 28],
  ['fi-pasta-dinner', 'Pasta with tomato sauce and cheese', 300, 440, 16],
  ['fi-roast-dinner', 'Small roast dinner', 380, 500, 32],
  ['fi-soup-dinner', 'Hearty soup with bread and butter', 400, 350, 12],
  ['fi-jacket', 'Jacket potato with beans', 300, 380, 12],
  ['fi-apple', 'Apple', 130, 80, 0],
  ['fi-biscuit-tea', 'Two biscuits with tea', 25, 150, 2],
  ['fi-nuts', 'Small handful of nuts', 30, 170, 6],
  ['fi-cheese-crackers', 'Cheese and crackers', 60, 200, 8],
  ['fi-milk-coffee', 'Milky coffee', 200, 90, 5],
  ['fi-fruit-salad', 'Fruit salad', 150, 110, 1],
  ['fi-custard', 'Small bowl of custard', 150, 160, 4],
  ['fi-scrambled', 'Scrambled eggs on toast', 160, 300, 16]
];

// meal: [id, name, itemIds]
const MEALS = [
  ['m-porridge', 'Porridge and banana', ['fi-oats', 'fi-banana']],
  ['m-egg-toast', 'Boiled egg and toast', ['fi-egg', 'fi-toast']],
  ['m-weetbix', 'Weet-Bix and milky coffee', ['fi-weetbix', 'fi-milk-coffee']],
  ['m-scrambled', 'Scrambled eggs on toast', ['fi-scrambled']],
  ['m-greek-fruit', 'Greek yoghurt with fruit', ['fi-greek', 'fi-fruit-salad']],
  ['m-cheese-sand', 'Cheese and tomato sandwich', ['fi-cheese-sand']],
  ['m-soup-roll', 'Vegetable soup and a roll', ['fi-soup']],
  ['m-tuna', 'Tuna salad', ['fi-tuna-salad', 'fi-toast']],
  ['m-chicken-sand', 'Chicken sandwich', ['fi-chicken-sand']],
  ['m-omelette', 'Omelette and salad', ['fi-omelette']],
  ['m-cottage', 'Cottage cheese on crackers', ['fi-cottage', 'fi-apple']],
  ['m-jacket', 'Jacket potato with beans', ['fi-jacket']],
  ['m-chicken-dinner', 'Chicken, potatoes and peas', ['fi-chicken-dinner']],
  ['m-fish-dinner', 'Baked fish, rice and veg', ['fi-fish-dinner']],
  ['m-mince-dinner', 'Savoury mince and veg', ['fi-mince-dinner']],
  ['m-pasta-dinner', 'Pasta with tomato sauce', ['fi-pasta-dinner']],
  ['m-roast', 'Small roast dinner', ['fi-roast-dinner']],
  ['m-soup-dinner', 'Hearty soup and bread', ['fi-soup-dinner']],
  ['m-yoghurt', 'Yoghurt', ['fi-yoghurt']],
  ['m-apple', 'Apple', ['fi-apple']],
  ['m-biscuit-tea', 'Biscuits and tea', ['fi-biscuit-tea']],
  ['m-nuts', 'Handful of nuts', ['fi-nuts']],
  ['m-cheese-crackers', 'Cheese and crackers', ['fi-cheese-crackers']],
  ['m-custard', 'Small bowl of custard', ['fi-custard']],
  ['m-fruit', 'Fruit salad', ['fi-fruit-salad']]
];

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function week(breakfasts, lunches, dinners, snacks) {
  const days = {};
  DAY_KEYS.forEach((d, i) => {
    days[d] = {
      breakfast: [breakfasts[i % breakfasts.length]],
      lunch: [lunches[i % lunches.length]],
      dinner: [dinners[i % dinners.length]],
      snack: [snacks[i % snacks.length]]
    };
  });
  return days;
}

const WEEK_PLANS = [
  {
    id: 'wp-balanced',
    name: 'Simple balanced',
    isPreset: 1,
    days: week(
      ['m-porridge', 'm-egg-toast', 'm-weetbix'],
      ['m-cheese-sand', 'm-soup-roll', 'm-tuna', 'm-jacket'],
      ['m-chicken-dinner', 'm-fish-dinner', 'm-mince-dinner', 'm-pasta-dinner', 'm-roast'],
      ['m-yoghurt', 'm-apple', 'm-biscuit-tea', 'm-fruit']
    )
  },
  {
    id: 'wp-protein',
    name: 'High protein',
    isPreset: 1,
    days: week(
      ['m-scrambled', 'm-greek-fruit', 'm-egg-toast'],
      ['m-tuna', 'm-chicken-sand', 'm-omelette', 'm-cottage'],
      ['m-chicken-dinner', 'm-fish-dinner', 'm-mince-dinner', 'm-roast'],
      ['m-nuts', 'm-yoghurt', 'm-cheese-crackers']
    )
  },
  {
    id: 'wp-light',
    name: 'Light & easy',
    isPreset: 1,
    days: week(
      ['m-weetbix', 'm-porridge', 'm-greek-fruit'],
      ['m-soup-roll', 'm-cheese-sand', 'm-cottage'],
      ['m-soup-dinner', 'm-omelette', 'm-jacket', 'm-fish-dinner'],
      ['m-apple', 'm-custard', 'm-biscuit-tea', 'm-fruit']
    )
  }
];

// ---------- exercise ----------

const EXERCISES = [
  {
    id: 'ex-shoulder-rolls',
    name: 'Shoulder rolls',
    reps: '10 times',
    figure: 'shoulder-roll',
    steps: [
      'Sit or stand tall with your arms relaxed by your sides.',
      'Slowly roll both shoulders up, back and down in a big circle.',
      'Repeat 10 times, breathing gently as you go.'
    ],
    safetyNote: 'Keep the movement slow and smooth. Stop if you feel any sharp pain.',
    easierVersion: 'Roll one shoulder at a time, and make the circles smaller.'
  },
  {
    id: 'ex-reach-up',
    name: 'Reach for the sky',
    reps: '8 times',
    figure: 'reach-up',
    steps: [
      'Sit or stand tall, arms by your sides.',
      'Slowly reach both arms up above your head as far as is comfortable.',
      'Lower them gently back down. Repeat 8 times.'
    ],
    safetyNote: 'Only reach as high as feels comfortable — no need to force it.',
    easierVersion: 'Reach one arm up at a time, keeping the other hand on your lap.'
  },
  {
    id: 'ex-neck-turns',
    name: 'Gentle neck turns',
    reps: '5 each side',
    figure: 'neck-turn',
    steps: [
      'Sit tall and look straight ahead.',
      'Slowly turn your head to look over one shoulder, then back to the middle.',
      'Turn to the other side. Do 5 slow turns each way.'
    ],
    safetyNote: 'Move slowly and never force your neck. Dizziness means stop and rest.',
    easierVersion: 'Make the turns smaller — just past your collarbone is fine.'
  },
  {
    id: 'ex-ankle-circles',
    name: 'Ankle circles',
    reps: '10 each foot',
    figure: 'ankle-circle',
    steps: [
      'Sit on a sturdy chair and lift one foot slightly off the floor.',
      'Draw slow circles with your toes — 10 one way, then 10 the other.',
      'Swap feet and repeat.'
    ],
    safetyNote: 'Hold the sides of the chair for balance.',
    easierVersion: 'Keep your heel on the floor and just point your toes up and down.'
  },
  {
    id: 'ex-back-twist',
    name: 'Seated back twist',
    reps: '5 each side',
    figure: 'twist',
    steps: [
      'Sit tall with your feet flat on the floor.',
      'Place your hands on your thighs and slowly turn your upper body to one side.',
      'Come back to the middle, then turn the other way. 5 slow turns each side.'
    ],
    safetyNote: 'Twist only as far as is comfortable. Keep your hips facing forward.',
    easierVersion: 'Cross your arms over your chest and make the turns smaller.'
  },
  {
    id: 'ex-breathe',
    name: 'Deep breaths',
    reps: '5 breaths',
    figure: 'breathe',
    steps: [
      'Sit comfortably with your shoulders relaxed.',
      'Breathe in slowly through your nose while your tummy rises.',
      'Breathe out gently through your mouth. Take 5 slow breaths.'
    ],
    safetyNote: 'If you feel light-headed, go back to normal breathing.',
    easierVersion: 'Take 3 breaths instead of 5.'
  },
  {
    id: 'ex-sit-stand',
    name: 'Sit to stand',
    reps: '10 times',
    figure: 'sit-stand',
    steps: [
      'Sit near the front of a sturdy chair, feet flat and slightly back.',
      'Lean forward a little and push up to standing — use the armrests if you need.',
      'Slowly sit back down with control. Repeat 10 times.'
    ],
    safetyNote: 'Use a chair that will not slide. Have something stable in front of you to hold if needed.',
    easierVersion: 'Do 5 instead of 10, and push off the armrests every time.'
  },
  {
    id: 'ex-seated-march',
    name: 'Seated march',
    reps: '20 steps',
    figure: 'march',
    steps: [
      'Sit tall with your feet flat on the floor.',
      'Lift one knee up, put it down, then lift the other — like a slow march.',
      'Keep going for 20 steps in total.'
    ],
    safetyNote: 'Hold the sides of the chair if you need more balance.',
    easierVersion: 'Lift your heels instead of your whole foot.'
  },
  {
    id: 'ex-knee-ext',
    name: 'Knee straightens',
    reps: '10 each leg',
    figure: 'knee-ext',
    steps: [
      'Sit tall on a sturdy chair.',
      'Slowly straighten one knee until your leg is out in front, then lower it.',
      'Do 10 on one leg, then 10 on the other.'
    ],
    safetyNote: 'Lower your leg slowly — do not let it drop.',
    easierVersion: 'Straighten your knee only halfway.'
  },
  {
    id: 'ex-heel-raises',
    name: 'Heel raises',
    reps: '12 times',
    figure: 'heel-raise',
    steps: [
      'Stand tall holding the back of a sturdy chair or the kitchen bench.',
      'Slowly rise up onto your toes, then lower your heels with control.',
      'Repeat 12 times.'
    ],
    safetyNote: 'Always keep hold of something stable while you do these.',
    easierVersion: 'Do them sitting down, lifting your heels off the floor.'
  },
  {
    id: 'ex-side-bends',
    name: 'Seated side bends',
    reps: '6 each side',
    figure: 'side-bend',
    steps: [
      'Sit tall with your feet flat and arms by your sides.',
      'Slowly slide one hand down towards the floor, bending gently sideways.',
      'Come back up tall, then bend the other way. 6 each side.'
    ],
    safetyNote: 'Bend sideways only — do not lean forward or backward.',
    easierVersion: 'Make the bends very small, just a few centimetres.'
  },
  {
    id: 'ex-arm-punches',
    name: 'Gentle arm punches',
    reps: '10 each arm',
    figure: 'punch',
    steps: [
      'Sit tall with your elbows bent and hands in loose fists.',
      'Slowly punch one arm forward at shoulder height, then bring it back.',
      'Alternate arms — 10 punches each side.'
    ],
    safetyNote: 'Keep the punches slow and controlled, not fast.',
    easierVersion: 'Punch at a lower height, towards your knees.'
  },
  {
    id: 'ex-warm-up-walk',
    name: 'Warm-up stroll',
    minutes: 5,
    figure: 'walk',
    steps: [
      'Put on comfortable shoes and step outside, or walk around the house.',
      'Walk at an easy, relaxed pace for about 5 minutes.',
      'Let your arms swing gently as you go.'
    ],
    safetyNote: 'Choose a flat, even path. Take your phone and walking stick if you use one.',
    easierVersion: 'Walk up and down the hallway for 2–3 minutes.'
  },
  {
    id: 'ex-brisk-walk',
    name: 'Walk',
    minutes: 20,
    figure: 'walk',
    steps: [
      'After warming up, walk a little faster — you should still be able to chat.',
      'Keep going for about 20 minutes, turning back halfway.',
      'Slow down if you feel out of breath.'
    ],
    safetyNote: 'Stop and rest on a bench if you feel tired, dizzy or sore.',
    easierVersion: 'Walk for 10 minutes instead, or split it into two short walks.'
  },
  {
    id: 'ex-cool-down',
    name: 'Cool-down and calf stretch',
    minutes: 5,
    figure: 'stretch-calf',
    steps: [
      'Walk slowly for a few minutes to let your body settle.',
      'Hold a wall, step one foot back and press the heel down to stretch the calf.',
      'Hold for 15 seconds each leg, breathing normally.'
    ],
    safetyNote: 'Keep hold of the wall or a rail during the stretch.',
    easierVersion: 'Skip the stretch and just finish with slow walking.'
  }
];

const ROUTINES = [
  {
    id: 'rt-morning',
    name: 'Morning stretch',
    isPreset: 1,
    exerciseIds: [
      'ex-breathe',
      'ex-shoulder-rolls',
      'ex-neck-turns',
      'ex-reach-up',
      'ex-back-twist',
      'ex-ankle-circles'
    ]
  },
  {
    id: 'rt-chair',
    name: 'Chair exercises',
    isPreset: 1,
    exerciseIds: [
      'ex-sit-stand',
      'ex-seated-march',
      'ex-knee-ext',
      'ex-heel-raises',
      'ex-side-bends',
      'ex-arm-punches'
    ]
  },
  {
    id: 'rt-walk',
    name: 'Daily walk',
    isPreset: 1,
    exerciseIds: ['ex-warm-up-walk', 'ex-brisk-walk', 'ex-cool-down']
  }
];

export async function seedPresets() {
  await db.transaction(
    'rw',
    [db.foodItems, db.meals, db.weekPlans, db.exercises, db.routines],
    async () => {
      // Presets are read-only in the app, so overwriting them on every
      // start keeps old installs up to date with new preset content.
      for (const [id, name, grams, calories, protein] of ITEMS) {
        await db.foodItems.put({ id, name, grams, calories, protein });
      }
      for (const [id, name, itemIds] of MEALS) {
        await db.meals.put({ id, name, itemIds });
      }
      for (const wp of WEEK_PLANS) await db.weekPlans.put(wp);
      for (const ex of EXERCISES) await db.exercises.put(ex);
      for (const rt of ROUTINES) await db.routines.put(rt);
    }
  );
}
