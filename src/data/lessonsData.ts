import type { Lesson, LessonCategory } from "../types/lessons";

/**
 * Typing curriculum adapted from the free lesson progression on learntyping.org
 * (Beginner 1a–7 and Advanced 1–7). Practice drills follow the same key-introduction
 * order; content is formatted for TypeArena's lesson practice UI.
 */
export const LESSON_CATEGORIES: LessonCategory[] = [
  {
    tier: "beginner",
    title: "Beginner Lessons",
    description:
      "Build touch-typing from the home row outward — letters, capitals, punctuation, and common combinations. Work through each lesson carefully before moving on.",
    badge: "🌱 Beginner",
  },
  {
    tier: "advanced",
    title: "Advanced Lessons",
    description:
      "Speed, shift mastery, hand-focused drills, symbols, and the number row. Designed for typists who already know the full alphabet.",
    badge: "⚡ Advanced",
  },
];

export const LESSONS: Lesson[] = [
  {
    id: "beginner-1a",
    tier: "beginner",
    title: "Beginner 1a: Home Row Keys",
    subtitle: "Home row keys: A S D F J K L ;",
    targetKeys: [
      "a",
      "s",
      "d",
      "f",
      "j",
      "k",
      "l",
      ";",
      "space"
    ],
    fingerGuideHint: "Rest left fingers on A S D F and right fingers on J K L ;. Thumbs on spacebar. Feel the bumps on F and J.",
    text: "ffff dddd ssss aaaa ffff dddd ssss aaaa ffff dddd ssss aaaa ff dd ss aa ff dd ss aa ff d ff d ff s ff s ff a ff a fdsa fdsa fdsa fdsa fdsa fdsa fdsa fdsa asdf asdf asdf asdf asdf asdf asdf asdf asdf asdf fads dafs safd dsaf fasd adfs sdaf afds fdsa jjj kkk lll ;;; jjj kkk lll ;;; jjj kkk lll ;;;jj kk ll ;; jj kk ll ;; jj kk ll ;; jj kk ll ;; jj k jj l jj ; j k l ; j k l ; jjj kkk ll ;;",
    minAccuracyToPass: 85,
    starThresholds: {
      oneStar: 14,
      twoStars: 24,
      threeStars: 36
    }
  },
  {
    id: "beginner-1b",
    tier: "beginner",
    title: "Beginner 1b: E, U, I & R",
    subtitle: "Vowels E, U, I and letter R",
    targetKeys: [
      "e",
      "u",
      "i",
      "r",
      "a",
      "s",
      "d",
      "f",
      "j",
      "k",
      "l",
      "space"
    ],
    fingerGuideHint: "Reach up to E (left middle), R (left index), U (right index), I (right middle). Return to home row after each key.",
    text: "deed frrf deer reed red deed frrf deer reed red deed frrf deer reed red free freed fred feed fed free freed fred feed fed free freed fred feed fed reef reef ref ref refer refer defer defer referred deferred refereed juuj juuj juju juju kiik kiik kiki kiki juki juki kiju kiju jiku jiku juik juik ijku jj uu kk ii jj uu kk ii jk jk ui ui jk jk ui ui jk ui jk ui ijku ujik ukij ujik ikij ikiu",
    minAccuracyToPass: 86,
    starThresholds: {
      oneStar: 16,
      twoStars: 26,
      threeStars: 38
    }
  },
  {
    id: "beginner-2a",
    tier: "beginner",
    title: "Beginner 2a: G & H",
    subtitle: "Key letters G and H",
    targetKeys: [
      "g",
      "h",
      "a",
      "s",
      "d",
      "f",
      "j",
      "k",
      "l",
      "space"
    ],
    fingerGuideHint: "Left index reaches right to G; right index reaches left to H. Always return to F and J.",
    text: "fg fg fg fgf fgt fg ft ft ft dfg dfgt dft dft frt frt frt frtg frtg frtg fgt fgt fgt dfrt dfrt dfrt dfrt dert dert dert dert jhj jhj jhj jhj jujhj jujhj jujhj jujhj hijk hujk hijk hujk jhjkik jhjkik jhjkik kikjuj kikjuj kikjuj jujkik jujkik jhik jhik jhik jihk jihk jihi jihi jihi kih kih kih huhi huhi fg jh fg jh ft jh fgt fgt fgt ght ght ght th th th",
    minAccuracyToPass: 86,
    starThresholds: {
      oneStar: 18,
      twoStars: 28,
      threeStars: 40
    }
  },
  {
    id: "beginner-2b",
    tier: "beginner",
    title: "Beginner 2b: W, T, O & Y",
    subtitle: "Letters W, T, O, Y (plus S, L)",
    targetKeys: [
      "w",
      "t",
      "o",
      "y",
      "s",
      "l",
      "space"
    ],
    fingerGuideHint: "Left ring to W, left index up to T, right ring to O, right index up-left to Y.",
    text: "fff ddd sss www fff ddd sss www fff ddd sss www fds fds fdsw fdsw frf ded sws frf ded sws frf ded sws fdd fss ree rww rww rew rew rews rews dew dews ffds ffds ffdsw fdsw fds fdsw wsdf wsdf sdf fdsdf fdsdf ffss ffss ffsf ff ssf ff ssf fdsdf fdsdf frf ded sws juj juj jujyj jujyj jyj jhj jhj jhjyj jhjyj jujhj jujhj ujh ujh jklol jklol jklol lol lol lol lol jujhj klol jujhj klol kol kol",
    minAccuracyToPass: 87,
    starThresholds: {
      oneStar: 20,
      twoStars: 30,
      threeStars: 42
    }
  },
  {
    id: "beginner-3",
    tier: "beginner",
    title: "Beginner 3: V, B, N & M",
    subtitle: "Bottom row: V, B, N, M",
    targetKeys: [
      "v",
      "b",
      "n",
      "m",
      "space"
    ],
    fingerGuideHint: "Left index down to V and further to B; right index down to N and M. Keep other fingers on home row.",
    text: "fvf frfvf fbf frfbf rev vet fvf frfvf fbf frfbf rev vet five fiver fib fibber fibre very every five fiver fib fibber fibre very every everyone jmj jujmj jnj jujnj jmj jujmj jnj jujnj jim him kim tim rim trim hem them jim him kim tim rim trim hem them jnj jujnj tin fin din dint tint jnj jujnj tin fin din dint dinted tin tint tinted",
    minAccuracyToPass: 87,
    starThresholds: {
      oneStar: 22,
      twoStars: 32,
      threeStars: 44
    }
  },
  {
    id: "beginner-4",
    tier: "beginner",
    title: "Beginner 4: Capitals & C",
    subtitle: "Capitals with Shift keys + letter C",
    targetKeys: [
      "c",
      "Shift",
      "space"
    ],
    fingerGuideHint: "Use the opposite pinky for Shift when capitalizing. Left middle reaches down to C.",
    text: "ded dcd ded cdc dedcd dedcd decided deck decks decked check checks cheese chest cheek check checked creek creeks dice diced slice sliced twice nice mince minced Otherwise you might finish with clumsy, unnecessary errors. Look before you cross the street or you might get knocked down. Jimmy Colven drove Henry Dempsy to town to buy some new comic books.",
    minAccuracyToPass: 88,
    starThresholds: {
      oneStar: 24,
      twoStars: 34,
      threeStars: 46
    }
  },
  {
    id: "beginner-5",
    tier: "beginner",
    title: "Beginner 5: A, P, Q, Z & X",
    subtitle: "Letters A, P, Q, Z, X",
    targetKeys: [
      "a",
      "p",
      "q",
      "z",
      "x",
      "space"
    ],
    fingerGuideHint: "Pinkies handle Q, A, Z, P, and often X reaches. Stay light on the keys.",
    text: "faf far fat fatter far farmer faf far fat fatter far farmer frame fame famine fade fan ran tan jan land hand band fan ran tan jan land hand band sand banner pot port pit put pop pup puppy pot port pit put pop pup puppy poppy pappy purr top rope romp trap tramp trumpet purr top rope romp trap tramp trumpet fig rig tig pig got grip grab grasp green fig rig tig pig got grip grab grasp green",
    minAccuracyToPass: 88,
    starThresholds: {
      oneStar: 26,
      twoStars: 36,
      threeStars: 48
    }
  },
  {
    id: "beginner-6",
    tier: "beginner",
    title: "Beginner 6: Punctuation",
    subtitle: "Punctuation: , . ; ? - ( ) \" !",
    targetKeys: [
      ",",
      ".",
      ";",
      "?",
      "-",
      "(",
      ")",
      "\"",
      "!",
      "space"
    ],
    fingerGuideHint: "Right hand handles most punctuation. Use Shift with the opposite pinky for ? ! \" ( ).",
    text: "If you practise your typing each day, it will soon become easy. Join for hyphen. First-class. Did you enjoy this typing course? I hope so! \"Hullo,\" said Julia to George. \"Isn't it a really lovely day?\" \"Stop! There's too much noise! It's giving me a headache!\" MONDAY TUESDAY WEDNESDAY THURSDAY FRIDAY SATURDAY SUNDAY Swimming Netball Football Skydiving Drama Rugby Golf",
    minAccuracyToPass: 89,
    starThresholds: {
      oneStar: 28,
      twoStars: 38,
      threeStars: 50
    }
  },
  {
    id: "beginner-7",
    tier: "beginner",
    title: "Beginner 7: Common Combinations",
    subtitle: "Common letter combinations for speed",
    targetKeys: [
      "a",
      "e",
      "i",
      "o",
      "u",
      "t",
      "h",
      "n",
      "s",
      "r",
      "space"
    ],
    fingerGuideHint: "Type common digraphs as single smooth motions. Accuracy first, then rhythm.",
    text: "this list; his list; lists wish dish fish wrist fist kiss kissed missed fist wrist list listed twist twisted twister this is a twister mister; all wall walls fall falls hall halls taller tallest call calls stall stalls all tall stall stalls stalled walls; all tall walls fall; hallowed wh where whether who whose what whole where whether weather",
    minAccuracyToPass: 89,
    starThresholds: {
      oneStar: 30,
      twoStars: 40,
      threeStars: 52
    }
  },
  {
    id: "advanced-1",
    tier: "advanced",
    title: "Advanced 1: Letter Combinations",
    subtitle: "Common letter combinations",
    targetKeys: [
      "t",
      "h",
      "e",
      "i",
      "n",
      "g",
      "s",
      "r",
      "space"
    ],
    fingerGuideHint: "Build automatic combos: th, he, in, er, an, re, on, at, en, nd.",
    text: "ou you your yours out ou ough rough trough through though cough enough ou ought thought bought brought ou ought thought bought brought nought au augh laugh laughter laughed laughs au aught taught caught taught caught sh she shell shelter shall sheep sh she shell shelter shall shallow sheep shape oi oil toil toiled soil soiled spoil spoiled coin coined coil recoil uncoil foil pop poll polls pole poles pip pill pile piles pillow up pup put pull pulled",
    minAccuracyToPass: 90,
    starThresholds: {
      oneStar: 23,
      twoStars: 35,
      threeStars: 51
    }
  },
  {
    id: "advanced-2",
    tier: "advanced",
    title: "Advanced 2: Shift Keys & Capitals",
    subtitle: "Left and right Shift keys",
    targetKeys: [
      "Shift",
      "A",
      "B",
      "C",
      "space"
    ],
    fingerGuideHint: "Capitalize left-hand letters with right Shift, and right-hand letters with left Shift.",
    text: "Alexandra Auckland Blenheim Dunedin Christchurch Dannevirke East Taieri Fiordland Frankton Greymouth Queenstown Ravensbourne Rotorua Springhills St Claire Taumarunui Taupo Victoria Valley Waimate Wellington Haast Pass Hokitika Invercargill Jamestown Kaikoura Katikati Kawerau Lawrence Lyttleton Masterton Milton Motueka New Plymouth Nelson Ngaruawahia Oamaru Otorohunga Papatoetoe Palmerston Paraparaumu Upper Hutt",
    minAccuracyToPass: 90,
    starThresholds: {
      oneStar: 26,
      twoStars: 38,
      threeStars: 54
    }
  },
  {
    id: "advanced-3",
    tier: "advanced",
    title: "Advanced 3: Left Hand Focus",
    subtitle: "Left hand key focus",
    targetKeys: [
      "q",
      "w",
      "e",
      "r",
      "t",
      "a",
      "s",
      "d",
      "f",
      "g",
      "z",
      "x",
      "c",
      "v",
      "b",
      "space"
    ],
    fingerGuideHint: "Emphasize left-hand reaches while the right hand anchors on home row / Shift.",
    text: "Alan and Alice and Alma alighted at Auckland Airport after arriving. Sarah's sharp scissors slit Sandra's soft, silky scarf severely. David demanded Doris drive directly down Derek Duff's dark deserted drive. Finally Frank found freedom from Freddy Foster's fierce fist fight. Grandfather Greer grew great giant green gooseberries grandly. Quenton quickly quietened Queenie's quippy quadraphonic quizzshow. Wendy went wild with wonder when Wally washed windows with Window Wipe.",
    minAccuracyToPass: 91,
    starThresholds: {
      oneStar: 29,
      twoStars: 41,
      threeStars: 57
    }
  },
  {
    id: "advanced-4",
    tier: "advanced",
    title: "Advanced 4: Right Hand Focus",
    subtitle: "Right hand key focus",
    targetKeys: [
      "y",
      "u",
      "i",
      "o",
      "p",
      "h",
      "j",
      "k",
      "l",
      ";",
      "n",
      "m",
      ",",
      ".",
      "/",
      "space"
    ],
    fingerGuideHint: "Emphasize right-hand reaches while the left hand anchors on home row / Shift.",
    text: "How has Humphrey Henderson hacked Hillary Harding's hawthorne hedge? Jennifer Judge jumped joyfully. Jerry Johnson jubilantly joined Jenny jumping. Katy Kitchener's kitten kindly caught Kelly's knotted kite string. Norman needed ninetynine nifty notches nailed neatly nextdoor. Martha Miller made many monthly Missionary mailings. Yesterday your yellow yacht yanked Yvonne's yellow yacht. Uncle undid Una's uniform umbrellas under umpteen upsidedown cartons.",
    minAccuracyToPass: 91,
    starThresholds: {
      oneStar: 32,
      twoStars: 44,
      threeStars: 60
    }
  },
  {
    id: "advanced-5",
    tier: "advanced",
    title: "Advanced 5: Alternating Hands",
    subtitle: "Alternate left and right hand drills",
    targetKeys: [
      "a",
      "s",
      "d",
      "f",
      "j",
      "k",
      "l",
      ";",
      "space"
    ],
    fingerGuideHint: "Alternate hands smoothly. Short words then longer words to build flow.",
    text: "art tart dart cart rave wave save ear wear rear tear sear dear fear gear bear west rest test fest zest best crest eve ever are ware rare tare dare care barer feed reed deed weed eat seat beat rare fare dare rate date fate gate grate crates fact tact tract ace race trace grace face brace case base star stars art start tasted feast beast beat seat great gaze daze dazed faze fazed craved traced extracted stares terrace garages ravages created creates terrace",
    minAccuracyToPass: 91,
    starThresholds: {
      oneStar: 35,
      twoStars: 47,
      threeStars: 63
    }
  },
  {
    id: "advanced-6",
    tier: "advanced",
    title: "Advanced 6: Symbols & Special Chars",
    subtitle: "Numbers and special characters (& % @ $)",
    targetKeys: [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "0",
      "&",
      "%",
      "@",
      "$",
      "space"
    ],
    fingerGuideHint: "Reach to the number row without lifting wrists. Use Shift for symbols above numbers.",
    text: "Smith & Smith Smith & Brown Black, Brown & Co Ltd J. K. Long & Co Inc. Monday & Friday Turner & Turner Ltd $44 $444 $445 $454 $400 $450 $44.50 $450.45 $44.55 $4.54 $90.00 $90.99 $49.99 $499.99 $450.45 $94.49 $40.49 $90.40 5% 55% 56% 54% 50% 4% 4.5% 3% 3.5% 15% 5.5% 5.4% 3.54% 22 @ 5% 12 @ 15% 12 @ 10% 220 @ 15% 52 @ 5% @ 25% 252 (9) (98) (97) (96) (900) (800) (700) (989) (990) (999) (898) (see next page) (I hope) (every day) (sometimes) (maybe) (hmmm)",
    minAccuracyToPass: 92,
    starThresholds: {
      oneStar: 38,
      twoStars: 50,
      threeStars: 66
    }
  },
  {
    id: "advanced-7",
    tier: "advanced",
    title: "Advanced 7: Number Row Mastery",
    subtitle: "Focus on numbers",
    targetKeys: [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "0",
      "space"
    ],
    fingerGuideHint: "Map each number to its home-row finger. Return to home keys after every number.",
    text: "aq1 qa sw2ws de3ed fr4rf gt5tg 1 queen 11 queens 1 apple 11 apples 2 wishes 22 wishes 2 swims 22 swims 3 eddies 33 eddies 3 deeds 33 deeds 4 roses 44 roses 4 fish 44 fish 5 tugs 55 tugs 5 goats 55 goats 6 yams 66 yams 6 hams 66 hams 7 umpires 77 umpires 7 jokes 77 jokes 8 ideas 88 ideas 8 kites 88 kites 9 olives 99 olives 9 lollies 99 lollies 12 wishes 122 wishes 12 seeds 12 2 seeds 13 eggs 133 eggs 13 deeds 133 deeds",
    minAccuracyToPass: 92,
    starThresholds: {
      oneStar: 41,
      twoStars: 53,
      threeStars: 69
    }
  }
];
