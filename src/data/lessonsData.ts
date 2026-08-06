import type { Lesson, LessonCategory } from "../types/lessons";

export const LESSON_CATEGORIES: LessonCategory[] = [
  {
    tier: "beginner",
    title: "Beginner Lessons",
    description: "Build touch-typing from the home row outward — letters, capitals, punctuation, and common combinations from learntyping.org.",
    badge: "🌱 Beginner",
  },
  {
    tier: "advanced",
    title: "Advanced Lessons",
    description: "Speed, shift mastery, hand-focused drills, symbols, and number row from learntyping.org.",
    badge: "⚡ Advanced",
  },
];

export const LESSONS: Lesson[] = [
  {
    "id": "beginner-1a",
    "tier": "beginner",
    "code": "1a",
    "title": "Beginner Lesson 1(a): Home Row Keys",
    "subtitle": "Home row keys: A S D F J K L ;",
    "targetKeys": [
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
    "fingerGuideHint": "Rest left fingers on A S D F and right fingers on J K L ;. Thumbs on spacebar. Feel the bumps on F and J.",
    "minAccuracyToPass": 85,
    "starThresholds": {
      "oneStar": 14,
      "twoStars": 24,
      "threeStars": 36
    },
    "exercises": [
      {
        "id": "beginner-1a-ex1",
        "title": "Exercise 1: Left Hand Home Row (A S D F)",
        "text": "ffff dddd ssss aaaa ffff dddd ssss aaaa ffff dddd ssss aaaa ff dd ss aa ff dd ss aa ff d ff d ff s ff s ff a ff a fdsa fdsa fdsa fdsa fdsa fdsa fdsa fdsa asdf asdf asdf asdf asdf asdf asdf asdf asdf asdf fads dafs safd dsaf fasd adfs sdaf afds fdsa"
      },
      {
        "id": "beginner-1a-ex2",
        "title": "Exercise 2: Right Hand Home Row (J K L ;)",
        "text": "jjj kkk lll ;;; jjj kkk lll ;;; jjj kkk lll ;;;jj kk ll ;; jj kk ll ;; jj kk ll ;; jj kk ll ;; jj k jj l jj ; j k l ; j k l ; jjj kkk ll ;; jkl; jkl; jkl; jkl; jkl; jkl; jkl; jkl; jkl; jkl; jkl; jkl; ;lkj ;lkj ;lkj ;lkj ;lkj ;lkj ;lkj ;lkj ;lkj ;lkj ;lkj ;lkj ;lkj"
      },
      {
        "id": "beginner-1a-ex3",
        "title": "Exercise 3: Home Row Words & Sentences",
        "text": "fad fads lad lads lass alas salad salads dad dads lad lads salads alas ad add ads adds as ask asks la lad lads lass da dad dada dada sa sad salad all fall falls alf alfa alfas fad fads salsa ska skald skalds flak flask flasks 30 minutes a day for 5 days a week will give you steady gains."
      }
    ],
    "text": "ffff dddd ssss aaaa ffff dddd ssss aaaa ffff dddd ssss aaaa ff dd ss aa ff dd ss aa ff d ff d ff s ff s ff a ff a fdsa fdsa fdsa fdsa fdsa fdsa fdsa fdsa asdf asdf asdf asdf asdf asdf asdf asdf asdf asdf fads dafs safd dsaf fasd adfs sdaf afds fdsa"
  },
  {
    "id": "beginner-1b",
    "tier": "beginner",
    "code": "1b",
    "title": "Beginner Lesson 1(b): Vowels E, U, I & Letter R",
    "subtitle": "Reach up to E, U, I and R",
    "targetKeys": [
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
    "fingerGuideHint": "Reach up to E (left middle), R (left index), U (right index), I (right middle). Return to home row after each key.",
    "minAccuracyToPass": 86,
    "starThresholds": {
      "oneStar": 16,
      "twoStars": 26,
      "threeStars": 38
    },
    "exercises": [
      {
        "id": "beginner-1b-ex1",
        "title": "Exercise 1: Left Hand Reaches (E & R)",
        "text": "deed frrf deer reed red deed frrf deer reed red deed frrf deer reed red free freed fred feed fed free freed fred feed fed free freed fred feed fed reef reef ref ref refer refer defer defer referred deferred refereed"
      },
      {
        "id": "beginner-1b-ex2",
        "title": "Exercise 2: Right Hand Reaches (U & I)",
        "text": "juuj juuj juju juju kiik kiik kiki kiki juki juki kiju kiju jiku jiku juik juik ijku jj uu kk ii jj uu kk ii jk jk ui ui jk jk ui ui jk ui jk ui ijku ujik ukij ujik ikij ikiu"
      },
      {
        "id": "beginner-1b-ex3",
        "title": "Exercise 3: Mixed Vowel Words",
        "text": "fire side ride hide wide dire sire tire wire hire rife life rife life dire side ride hide wide dire sire tire wire hire rife life rife life fire side ride hide wide dire sire tire wire hire rife life rife life"
      }
    ],
    "text": "deed frrf deer reed red deed frrf deer reed red deed frrf deer reed red free freed fred feed fed free freed fred feed fed free freed fred feed fed reef reef ref ref refer refer defer defer referred deferred refereed"
  },
  {
    "id": "beginner-2a",
    "tier": "beginner",
    "code": "2a",
    "title": "Beginner Lesson 2(a): Key Letters G & H",
    "subtitle": "Center column reaches G and H",
    "targetKeys": [
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
    "fingerGuideHint": "Left index reaches right to G; right index reaches left to H. Always return to F and J.",
    "minAccuracyToPass": 86,
    "starThresholds": {
      "oneStar": 18,
      "twoStars": 28,
      "threeStars": 40
    },
    "exercises": [
      {
        "id": "beginner-2a-ex1",
        "title": "Exercise 1: Key G Drills (Left Index Reach)",
        "text": "fg fg fg fgf fgt fg ft ft ft dfg dfgt dft dft frt frt frt frtg frtg frtg fgt fgt fgt dfrt dfrt dfrt dfrt dert dert dert dert"
      },
      {
        "id": "beginner-2a-ex2",
        "title": "Exercise 2: Key H Drills (Right Index Reach)",
        "text": "jhj jhj jhj jhj jujhj jujhj jujhj jujhj hijk hujk hijk hujk jhjkik jhjkik jhjkik kikjuj kikjuj kikjuj jujkik jujkik jhik jhik jhik jihk jihk jihi jihi jihi kih kih kih huhi huhi"
      },
      {
        "id": "beginner-2a-ex3",
        "title": "Exercise 3: G & H Combination Words",
        "text": "fg jh fg jh ft jh fgt fgt fgt ght ght ght th th th high ghoul ghost flight fight light sight night right tight slight height freight high ghoul ghost flight fight light sight night right tight slight height freight"
      }
    ],
    "text": "fg fg fg fgf fgt fg ft ft ft dfg dfgt dft dft frt frt frt frtg frtg frtg fgt fgt fgt dfrt dfrt dfrt dfrt dert dert dert dert"
  },
  {
    "id": "beginner-2b",
    "tier": "beginner",
    "code": "2b",
    "title": "Beginner Lesson 2(b): Letters O, T, W & R",
    "subtitle": "Top row keys: O, T, W, R",
    "targetKeys": [
      "o",
      "t",
      "w",
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
    "fingerGuideHint": "Reach to top row keys: W (left ring), T (left index), O (right ring).",
    "minAccuracyToPass": 87,
    "starThresholds": {
      "oneStar": 20,
      "twoStars": 30,
      "threeStars": 42
    },
    "exercises": [
      {
        "id": "beginner-2b-ex1",
        "title": "Exercise 1: Keys T & W (Left Hand Top Row)",
        "text": "ftt ftt ft ft ft ft ft ft ft ft ft ft ft ft ft ft ft ft ft ft sww sww sw sw sw sw sw sw sw sw sw sw sw sw sw sw sw sw sw sw sw"
      },
      {
        "id": "beginner-2b-ex2",
        "title": "Exercise 2: Key O (Right Ring Finger)",
        "text": "loo loo lo lo lo lo lo lo lo lo lo lo lo lo lo lo lo lo lo lo loo loo lo lo lo lo lo lo lo lo lo lo lo lo lo lo lo lo lo lo"
      },
      {
        "id": "beginner-2b-ex3",
        "title": "Exercise 3: Top Row Word Practice",
        "text": "two tow row rot tot lot too woo root toot soot boot foot shoot root toot soot boot foot shoot word work world worth worst work word work world worth worst work two tow row rot tot lot too woo root toot"
      }
    ],
    "text": "ftt ftt ft ft ft ft ft ft ft ft ft ft ft ft ft ft ft ft ft ft sww sww sw sw sw sw sw sw sw sw sw sw sw sw sw sw sw sw sw sw sw"
  },
  {
    "id": "beginner-3",
    "tier": "beginner",
    "code": "3",
    "title": "Beginner Lesson 3: Shift Keys & Capitalization",
    "subtitle": "Left and Right Shift key discipline",
    "targetKeys": [
      "Shift",
      "A",
      "S",
      "D",
      "F",
      "J",
      "K",
      "L",
      "space"
    ],
    "fingerGuideHint": "Use left pinky for right-hand capitals; right pinky for left-hand capitals.",
    "minAccuracyToPass": 88,
    "starThresholds": {
      "oneStar": 22,
      "twoStars": 32,
      "threeStars": 45
    },
    "exercises": [
      {
        "id": "beginner-3-ex1",
        "title": "Exercise 1: Right Hand Capitals (Left Shift Key)",
        "text": "Left Shift key holds for J K L ; to make uppercase J K L ; hold Left Shift press J K L ; J K L ; J K L ; John James Jack Jill Kelly Keith Kenneth Laura Luke"
      },
      {
        "id": "beginner-3-ex2",
        "title": "Exercise 2: Left Hand Capitals (Right Shift Key)",
        "text": "Right Shift key holds for A S D F to make uppercase A S D F hold Right Shift press A S D F A S D F A S D F Alice Andrew Arthur Sarah Sam David Daniel Frank"
      },
      {
        "id": "beginner-3-ex3",
        "title": "Exercise 3: Proper Names & Sentences",
        "text": "Jack and Jill went up the hill. Sam and Sarah saw Daniel and David. Alice asked Andrew to find Frank and Keith. Laura and Luke liked Kelly and Kenneth."
      }
    ],
    "text": "Left Shift key holds for J K L ; to make uppercase J K L ; hold Left Shift press J K L ; J K L ; J K L ; John James Jack Jill Kelly Keith Kenneth Laura Luke"
  },
  {
    "id": "beginner-4",
    "tier": "beginner",
    "code": "4",
    "title": "Beginner Lesson 4: Letters C, V, M & N",
    "subtitle": "Bottom row reaches: C, V, M, N",
    "targetKeys": [
      "c",
      "v",
      "m",
      "n",
      "a",
      "s",
      "d",
      "f",
      "j",
      "k",
      "l",
      "space"
    ],
    "fingerGuideHint": "Reach down: C (left middle), V (left index), M (right index), N (right index).",
    "minAccuracyToPass": 88,
    "starThresholds": {
      "oneStar": 24,
      "twoStars": 34,
      "threeStars": 48
    },
    "exercises": [
      {
        "id": "beginner-4-ex1",
        "title": "Exercise 1: Left Hand Bottom Row (C & V)",
        "text": "dcc dcc dc dc dc dc dc dc dc dc dc dc dc dc dc dc fvv fvv fv fv fv fv fv fv fv fv fv fv fv fv fv fv cave cave cave cave cave cave cave cave cave cave"
      },
      {
        "id": "beginner-4-ex2",
        "title": "Exercise 2: Right Hand Bottom Row (M & N)",
        "text": "jmm jmm jm jm jm jm jm jm jm jm jm jm jm jm jm jm jnn jnn jn jn jn jn jn jn jn jn jn jn jn jn jn jn name name name name name name name name name name"
      },
      {
        "id": "beginner-4-ex3",
        "title": "Exercise 3: Bottom Row Sentences",
        "text": "can man van cam nam mac vic van can man van cam nam mac vic van cave name main mine vance nance came fame tame name cave name main mine vance nance came fame tame name"
      }
    ],
    "text": "dcc dcc dc dc dc dc dc dc dc dc dc dc dc dc dc dc fvv fvv fv fv fv fv fv fv fv fv fv fv fv fv fv fv cave cave cave cave cave cave cave cave cave cave"
  },
  {
    "id": "beginner-5",
    "tier": "beginner",
    "code": "5",
    "title": "Beginner Lesson 5: Letters B & Y",
    "subtitle": "Index finger reaches B and Y",
    "targetKeys": [
      "b",
      "y",
      "a",
      "s",
      "d",
      "f",
      "j",
      "k",
      "l",
      "space"
    ],
    "fingerGuideHint": "Left index reaches down-right to B; right index reaches up-left to Y.",
    "minAccuracyToPass": 89,
    "starThresholds": {
      "oneStar": 25,
      "twoStars": 35,
      "threeStars": 50
    },
    "exercises": [
      {
        "id": "beginner-5-ex1",
        "title": "Exercise 1: Key B Drills (Left Index)",
        "text": "fbb fbb fb fb fb fb fb fb fb fb fb fb fb fb fb fb fbb fbb fb fb fb fb fb fb fb fb fb fb fb fb fb fb boy bag bat bed beg big bin bit bob box boy bag bat bed beg big bin bit bob box"
      },
      {
        "id": "beginner-5-ex2",
        "title": "Exercise 2: Key Y Drills (Right Index)",
        "text": "jyy jyy jy jy jy jy jy jy jy jy jy jy jy jy jy jy jyy jyy jy jy jy jy jy jy jy jy jy jy jy jy jy jy yam yes yet you your year yard yell yoga yam yes yet you your year yard yell yoga"
      },
      {
        "id": "beginner-5-ex3",
        "title": "Exercise 3: B & Y Word Practice",
        "text": "baby boy by play bay buy grey key toy day way baby boy by play bay buy grey key toy day way baby boys play by the bay every day baby boys play by the bay every day"
      }
    ],
    "text": "fbb fbb fb fb fb fb fb fb fb fb fb fb fb fb fb fb fbb fbb fb fb fb fb fb fb fb fb fb fb fb fb fb fb boy bag bat bed beg big bin bit bob box boy bag bat bed beg big bin bit bob box"
  },
  {
    "id": "beginner-6",
    "tier": "beginner",
    "code": "6",
    "title": "Beginner Lesson 6: Letters P, Q, X & Z",
    "subtitle": "Corner keys: P, Q, X, Z",
    "targetKeys": [
      "p",
      "q",
      "x",
      "z",
      "a",
      "s",
      "d",
      "f",
      "j",
      "k",
      "l",
      "space"
    ],
    "fingerGuideHint": "Reach to corner keys: P (right pinky), Q (left pinky), X (left ring down), Z (left pinky down).",
    "minAccuracyToPass": 90,
    "starThresholds": {
      "oneStar": 26,
      "twoStars": 36,
      "threeStars": 52
    },
    "exercises": [
      {
        "id": "beginner-6-ex1",
        "title": "Exercise 1: Top Corner Keys (P & Q)",
        "text": "lpp lpp lp lp lp lp lp lp lp lp lp lp lp lp lp lp aqq aqq aq aq aq aq aq aq aq aq aq aq aq aq aq aq pen pan pin pot put quick quit queen quote pen pan pin pot put quick quit queen quote"
      },
      {
        "id": "beginner-6-ex2",
        "title": "Exercise 2: Bottom Corner Keys (X & Z)",
        "text": "sxx sxx sx sx sx sx sx sx sx sx sx sx sx sx sx sx azz azz az az az az az az az az az az az az az az six tax box wax axe zip zoo zero zone six tax box wax axe zip zoo zero zone"
      },
      {
        "id": "beginner-6-ex3",
        "title": "Exercise 3: Corner Keys Sentences",
        "text": "the quick brown fox jumps over the lazy dog. the quick brown fox jumps over the lazy dog. pack my box with five dozen liquor jugs. pack my box with five dozen liquor jugs."
      }
    ],
    "text": "lpp lpp lp lp lp lp lp lp lp lp lp lp lp lp lp lp aqq aqq aq aq aq aq aq aq aq aq aq aq aq aq aq aq pen pan pin pot put quick quit queen quote pen pan pin pot put quick quit queen quote"
  },
  {
    "id": "beginner-7",
    "tier": "beginner",
    "code": "7",
    "title": "Beginner Lesson 7: Paragraph & Sentence Mastery",
    "subtitle": "Full alphabet touch-typing sentences",
    "targetKeys": [
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
      "h",
      "i",
      "j",
      "k",
      "l",
      "m",
      "n",
      "o",
      "p",
      "q",
      "r",
      "s",
      "t",
      "u",
      "v",
      "w",
      "x",
      "y",
      "z",
      "space"
    ],
    "fingerGuideHint": "Full keyboard integration. Maintain steady posture and continuous rhythm.",
    "minAccuracyToPass": 90,
    "starThresholds": {
      "oneStar": 28,
      "twoStars": 38,
      "threeStars": 55
    },
    "exercises": [
      {
        "id": "beginner-7-ex1",
        "title": "Exercise 1: Short Sentences",
        "text": "practice makes perfect. consistent daily typing builds muscle memory. keep your eyes on the screen and your hands on the home row keys at all times."
      },
      {
        "id": "beginner-7-ex2",
        "title": "Exercise 2: Medium Sentences",
        "text": "touch typing is a valuable skill that increases productivity and speed. by training your fingers to find keys automatically without looking down, you free your mind to focus entirely on your thoughts and writing."
      },
      {
        "id": "beginner-7-ex3",
        "title": "Exercise 3: Full Paragraph Mastery",
        "text": "congratulations on reaching the final beginner lesson! you have learned all twenty six letters of the english alphabet, the spacebar, and shift keys. continue practicing daily to build effortless speed and flawless accuracy."
      }
    ],
    "text": "practice makes perfect. consistent daily typing builds muscle memory. keep your eyes on the screen and your hands on the home row keys at all times."
  },
  {
    "id": "advanced-1",
    "tier": "advanced",
    "code": "1",
    "title": "Advanced Lesson 1: Speed & Rhythm",
    "subtitle": "Cadence control & speed maintenance",
    "targetKeys": [
      "a",
      "s",
      "d",
      "f",
      "j",
      "k",
      "l",
      ";",
      "e",
      "r",
      "t",
      "y",
      "u",
      "i",
      "o",
      "p",
      "space"
    ],
    "fingerGuideHint": "Maintain an even metronome cadence across easy and hard word combinations.",
    "minAccuracyToPass": 92,
    "starThresholds": {
      "oneStar": 30,
      "twoStars": 42,
      "threeStars": 60
    },
    "exercises": [
      {
        "id": "advanced-1-ex1",
        "title": "Exercise 1: High-Frequency N-Grams",
        "text": "the and for are but not you all any can had her was one our out day get has him his how man new now old see two way who boy did its let put say she too use"
      },
      {
        "id": "advanced-1-ex2",
        "title": "Exercise 2: Alternating Rhythm Drills",
        "text": "that with have this will your from they know want been good much some time very when come here just like long make many more only over such take than them well"
      },
      {
        "id": "advanced-1-ex3",
        "title": "Exercise 3: Speed Maintenance Sentences",
        "text": "speed typing is built upon smooth rhythmic execution rather than frantic keystrokes. maintain equal pressure on every key and let your fingers glide effortlessly."
      }
    ],
    "text": "the and for are but not you all any can had her was one our out day get has him his how man new now old see two way who boy did its let put say she too use"
  },
  {
    "id": "advanced-2",
    "tier": "advanced",
    "code": "2",
    "title": "Advanced Lesson 2: Shift Key Mastery",
    "subtitle": "Capitalization speed & geographical names",
    "targetKeys": [
      "Shift",
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z",
      "space"
    ],
    "fingerGuideHint": "Fluid shift key transitions. Never press Shift with the same hand that presses the letter key.",
    "minAccuracyToPass": 92,
    "starThresholds": {
      "oneStar": 32,
      "twoStars": 44,
      "threeStars": 62
    },
    "exercises": [
      {
        "id": "advanced-2-ex1",
        "title": "Exercise 1: City & Country Names (Part 1)",
        "text": "Auckland Wellington Christchurch Hamilton Dunedin Palmerston North Napier Nelson Rotorua New Plymouth Whangarei Invercargill Gisborne Blenheim Timaru Taupo"
      },
      {
        "id": "advanced-2-ex2",
        "title": "Exercise 2: City & Country Names (Part 2)",
        "text": "London Paris Tokyo New York Sydney Berlin Rome Madrid Toronto Chicago Singapore Seoul Dublin Vienna Prague Budapest Amsterdam Brussels Copenhagen Oslo"
      },
      {
        "id": "advanced-2-ex3",
        "title": "Exercise 3: Proper Titles & Full Capitals",
        "text": "United Nations World Health Organization International Monetary Fund European Union Federal Reserve Board Supreme Court Parliament Congress Senate House of Representatives"
      }
    ],
    "text": "Auckland Wellington Christchurch Hamilton Dunedin Palmerston North Napier Nelson Rotorua New Plymouth Whangarei Invercargill Gisborne Blenheim Timaru Taupo"
  },
  {
    "id": "advanced-3",
    "tier": "advanced",
    "code": "3",
    "title": "Advanced Lesson 3: Left Hand Emphasis",
    "subtitle": "Left hand stamina & key coordination",
    "targetKeys": [
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
    "fingerGuideHint": "Isolate left-hand finger movement while keeping the right hand relaxed on home row.",
    "minAccuracyToPass": 92,
    "starThresholds": {
      "oneStar": 34,
      "twoStars": 46,
      "threeStars": 64
    },
    "exercises": [
      {
        "id": "advanced-3-ex1",
        "title": "Exercise 1: Left Hand Short Words",
        "text": "art tart dart cart rave wave save ear wear rear tear west rest test fest zest best crest eve ever are ware feed reed deed weed eat seat beat rare fare dare rate"
      },
      {
        "id": "advanced-3-ex2",
        "title": "Exercise 2: Left Hand Trigraphs & Words",
        "text": "fact tact tract ace race trace grace face brace cave craved traced extracted wares terrace garages ravage axe tax wax wasted fasted crafted rested tested great"
      },
      {
        "id": "advanced-3-ex3",
        "title": "Exercise 3: Left Hand Alliterations",
        "text": "sarah's sharp scissors slit sandra's soft silky sweater. david demanded doris drive directly down derek's driveway. finally frank found freedom from freddy's fears."
      }
    ],
    "text": "art tart dart cart rave wave save ear wear rear tear west rest test fest zest best crest eve ever are ware feed reed deed weed eat seat beat rare fare dare rate"
  },
  {
    "id": "advanced-4",
    "tier": "advanced",
    "code": "4",
    "title": "Advanced Lesson 4: Right Hand Emphasis",
    "subtitle": "Right hand stamina & key coordination",
    "targetKeys": [
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
      "space"
    ],
    "fingerGuideHint": "Isolate right-hand finger movement while keeping the left hand relaxed on home row.",
    "minAccuracyToPass": 92,
    "starThresholds": {
      "oneStar": 34,
      "twoStars": 46,
      "threeStars": 64
    },
    "exercises": [
      {
        "id": "advanced-4-ex1",
        "title": "Exercise 1: Right Hand Short Words",
        "text": "jill hill kill pill mill nil poll jim jimmy john joy molly lolly polly nip nippy hip hippy ilk milk mill you yon upon hook look nook honk ponk lilly link pink"
      },
      {
        "id": "advanced-4-ex2",
        "title": "Exercise 2: Right Hand Longer Words",
        "text": "opinion million onion pumpkin lump jump hump plum monopoly homonym lymph polyp nymph minimum million opinion nylon kimono typhoon polo pony ploy polyp"
      },
      {
        "id": "advanced-4-ex3",
        "title": "Exercise 3: Right Hand Alliterations",
        "text": "norman needed ninetynine nifty notches nailed neatly into john's junk yard. humphrey henderson helped henry hunt for hillary's hidden heirloom in honolulu."
      }
    ],
    "text": "jill hill kill pill mill nil poll jim jimmy john joy molly lolly polly nip nippy hip hippy ilk milk mill you yon upon hook look nook honk ponk lilly link pink"
  },
  {
    "id": "advanced-5",
    "tier": "advanced",
    "code": "5",
    "title": "Advanced Lesson 5: Alternating Hands",
    "subtitle": "Alternating hand flow & finger independent velocity",
    "targetKeys": [
      "a",
      "s",
      "d",
      "f",
      "g",
      "h",
      "j",
      "k",
      "l",
      "q",
      "w",
      "e",
      "r",
      "t",
      "y",
      "u",
      "i",
      "o",
      "p",
      "space"
    ],
    "fingerGuideHint": "Alternate between left and right hand key strokes for maximum fluid speed.",
    "minAccuracyToPass": 92,
    "starThresholds": {
      "oneStar": 36,
      "twoStars": 48,
      "threeStars": 65
    },
    "exercises": [
      {
        "id": "advanced-5-ex1",
        "title": "Exercise 1: Strict Alternating Hand Words",
        "text": "social panel authentic chair field giant form name sign ancient problems shake lake flake quake world wish dish cocoa spam fork both hem them when visual girls"
      },
      {
        "id": "advanced-5-ex2",
        "title": "Exercise 2: Hand Swapping Trigraphs",
        "text": "end ne anger sang danger fang rang tang gang hang bang bangle mangle manger dangle tangle wangle say day gay hay jay kay lay pay ray tray way set fetch get regret"
      },
      {
        "id": "advanced-5-ex3",
        "title": "Exercise 3: High-Speed Flow Paragraph",
        "text": "alternating keystrokes between your left and right hands creates natural typing velocity because one finger positions itself while the opposite hand presses its key."
      }
    ],
    "text": "social panel authentic chair field giant form name sign ancient problems shake lake flake quake world wish dish cocoa spam fork both hem them when visual girls"
  },
  {
    "id": "advanced-6",
    "tier": "advanced",
    "code": "6",
    "title": "Advanced Lesson 6: Symbols & Special Characters",
    "subtitle": "Ampersand (&), Percent (%), At (@), Dollar ($)",
    "targetKeys": [
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
    "fingerGuideHint": "Reach to the top row without lifting wrists. Use Shift key for symbols above numbers.",
    "minAccuracyToPass": 92,
    "starThresholds": {
      "oneStar": 38,
      "twoStars": 50,
      "threeStars": 66
    },
    "exercises": [
      {
        "id": "advanced-6-ex1",
        "title": "Exercise 1: Ampersand (&) & Business Names",
        "text": "Smith & Smith Smith & Brown Black, Brown & Co Ltd J. K. Long & Co Inc. Monday & Friday Turner & Turner Ltd Johnson & Johnson Marks & Spencer Procter & Gamble"
      },
      {
        "id": "advanced-6-ex2",
        "title": "Exercise 2: Dollar Sign ($) & Currency Values",
        "text": "$44 $444 $445 $454 $400 $450 $44.50 $450.45 $44.55 $4.54 $90.00 $90.99 $49.99 $499.99 $450.45 $94.49 $40.49 $90.40 $1,250.00 $5,999.99 $10,000.00"
      },
      {
        "id": "advanced-6-ex3",
        "title": "Exercise 3: Percent (%) & At (@) Symbols",
        "text": "5% 55% 56% 54% 50% 4% 4.5% 3% 3.5% 15% 5.5% 5.4% 3.54% 22 @ 5% 12 @ 15% 12 @ 10% 220 @ 15% 52 @ 5% user@typearena.app admin@learntyping.org support@domain.com"
      }
    ],
    "text": "Smith & Smith Smith & Brown Black, Brown & Co Ltd J. K. Long & Co Inc. Monday & Friday Turner & Turner Ltd Johnson & Johnson Marks & Spencer Procter & Gamble"
  },
  {
    "id": "advanced-7",
    "tier": "advanced",
    "code": "7",
    "title": "Advanced Lesson 7: Number Row Mastery",
    "subtitle": "Complete number row digit coordination",
    "targetKeys": [
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
    "fingerGuideHint": "Map each number to its home-row finger. Return to home keys instantly.",
    "minAccuracyToPass": 92,
    "starThresholds": {
      "oneStar": 41,
      "twoStars": 53,
      "threeStars": 69
    },
    "exercises": [
      {
        "id": "advanced-7-ex1",
        "title": "Exercise 1: Number Row Reaches (1 to 5)",
        "text": "aq1 qa sw2ws de3ed fr4rf gt5tg 1 queen 11 queens 1 apple 11 apples 2 wishes 22 wishes 2 swims 22 swims 3 eddies 33 eddies 3 deeds 33 deeds 4 roses 44 roses 4 fish 44 fish 5 tugs 55 tugs 5 goats 55 goats"
      },
      {
        "id": "advanced-7-ex2",
        "title": "Exercise 2: Number Row Reaches (6 to 0)",
        "text": "hy6yh ju7uj ki8ik lo9ol p0p 6 yams 66 yams 6 hams 66 hams 7 umpires 77 umpires 7 jokes 77 jokes 8 ideas 88 ideas 8 kites 88 kites 9 olives 99 olives 9 lollies 99 lollies 10 poppies 100 poppies"
      },
      {
        "id": "advanced-7-ex3",
        "title": "Exercise 3: Addresses & Multi-Digit Numbers",
        "text": "12 West Side Ave 122 Steep Street 22 Wright Street 22 Stone Street 133 Eastside 13 Drivers Road 14 Rosedale Road 144 Riverside Road 4 Fernhill Road 66 Yardley Hill 88 Idour Lane 90 Princes Lane"
      }
    ],
    "text": "aq1 qa sw2ws de3ed fr4rf gt5tg 1 queen 11 queens 1 apple 11 apples 2 wishes 22 wishes 2 swims 22 swims 3 eddies 33 eddies 3 deeds 33 deeds 4 roses 44 roses 4 fish 44 fish 5 tugs 55 tugs 5 goats 55 goats"
  }
];
