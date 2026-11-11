// Refinement script for Bible data quality, accuracy, and question logic in Who-Bible
const fs = require('fs');
const path = require('path');

const peoplePath = path.join(__dirname, '..', 'assets', 'data', 'people.json');
const people = JSON.parse(fs.readFileSync(peoplePath, 'utf8'));
const map = new Map(people.map(p => [p.name, p]));

const updates = [
  {
    name: 'Titus',
    patch: {
      notable_events: [
        'Entrusted by Paul with organizing leadership and appointing elders in the churches of Crete',
        'Accompanied Paul and Barnabas to the council in Jerusalem as an uncircumcised Greek believer'
      ]
    }
  },
  {
    name: 'James (brother of Jesus)',
    patch: {
      notable_events: [
        'Authored the New Testament general letter emphasizing that faith without works is dead',
        'Pillar and prominent elder of the early Jerusalem church who spoke decisively at the Jerusalem Council'
      ]
    }
  },
  {
    name: 'Simon the Zealot',
    patch: {
      notable_events: [
        'Distinguished among the twelve disciples by his passionate patriotic background'
      ]
    }
  },
  {
    name: 'Abimelech',
    patch: {
      occupation: 'King of Gerar',
      short_bio: 'Philistine king of Gerar who made covenants of peace with Abraham and Isaac at Beersheba.',
      notable_events: [
        'Made a covenant of peace with Abraham and Isaac at Beersheba',
        'Returned Sarah to Abraham after being warned by God in a dream'
      ],
      verses: ['Genesis 20', 'Genesis 21:22-34', 'Genesis 26']
    }
  },
  {
    name: 'John Mark',
    patch: {
      notable_events: [
        'Accompanied Paul and Barnabas on their first missionary journey',
        'Authored the action-oriented Gospel presenting Christ as the Servant of the Lord'
      ]
    }
  },
  {
    name: 'Mary (mother of Jesus)',
    patch: {
      notable_events: [
        'Gave birth to Jesus in Bethlehem',
        'Stood faithfully at the foot of the cross during the Crucifixion'
      ]
    }
  },
  {
    name: 'Saul (first king)',
    patch: {
      notable_events: [
        'Was anointed by Samuel as the inaugural king over the united tribes of Israel',
        'Desperately consulted the medium of Endor on the eve of his final battle'
      ]
    }
  },
  {
    name: 'Caleb',
    patch: {
      notable_events: [
        'Brought back a faithful report with Joshua encouraging Israel to possess the land',
        'Boldly claimed the hill country of Hebron at age eighty-five and drove out the giants'
      ]
    }
  },
  {
    name: 'Enosh',
    patch: {
      notable_events: [
        'Lived during the generation when people first began to call upon the name of the Lord'
      ]
    }
  },
  {
    name: 'Nimrod',
    patch: {
      occupation: 'Mighty hunter, kingdom founder',
      notable_events: [
        'Built an early kingdom in Shinar and was renowned as a mighty hunter before the Lord'
      ]
    }
  },
  {
    name: 'Bildad',
    patch: {
      notable_events: [
        'Argued as a Shuhite friend of Job that God punishes only the unrighteous and defended strict divine justice'
      ]
    }
  },
  {
    name: 'Zophar',
    patch: {
      notable_events: [
        'Argued as a Naamathite friend of Job that divine wisdom surpasses human understanding and urged Job to repent'
      ]
    }
  },
  {
    name: 'Paul',
    patch: {
      notable_events: [
        'Encountered the risen Christ on the road to Damascus',
        'Undertook three major missionary journeys planting churches across the Roman Empire',
        'Survived a perilous shipwreck on the island of Malta while en route to Rome'
      ]
    }
  },
  {
    name: 'Chloe',
    patch: {
      notable_events: [
        'Led a Christian household that sent word to Paul concerning divisions in the Corinthian church'
      ]
    }
  },
  {
    name: 'Trophimus',
    patch: {
      notable_events: [
        'Traveled with Paul as an Ephesian Gentile companion and was left ill at Miletus'
      ]
    }
  },
  {
    name: 'Belshazzar',
    patch: {
      occupation: 'Co-regent and ruler of Babylon',
      notable_events: [
        'Held a feast using holy temple vessels from Jerusalem',
        'Saw the mysterious fingers writing on the palace wall on the night Babylon fell'
      ]
    }
  },
  {
    name: 'Onesimus',
    patch: {
      notable_events: [
        'Was a runaway bondservant who came to faith under Paul and returned to his master as a beloved brother in Christ'
      ]
    }
  },
  {
    name: 'Philemon',
    patch: {
      notable_events: [
        'Received a deeply personal letter from Paul urging him to forgive and welcome back Onesimus as a brother'
      ]
    }
  },
  {
    name: 'Melchizedek',
    patch: {
      occupation: 'King of Salem, priest of God Most High',
      notable_events: [
        'Served as king of Salem and priest of God Most High, blessing Abraham after the battle'
      ]
    }
  },
  {
    name: 'Phoebe',
    patch: {
      occupation: 'Deaconess of Cenchreae, benefactor',
      notable_events: [
        'Delivered the Epistle to the Romans and was commended by Paul as a deaconess and benefactor of many'
      ]
    }
  },
  {
    name: 'Manaen',
    patch: {
      notable_events: [
        'Served as a prophet and teacher in Antioch after having been brought up in the court of Herod the tetrarch'
      ]
    }
  },
  {
    name: 'Sosthenes',
    patch: {
      notable_events: [
        'Was beaten before the judgment seat of the Roman proconsul Gallio in Corinth',
        'Co-sent the First Epistle to the Corinthians with Paul as a trusted brother'
      ]
    }
  },
  {
    name: 'Adam',
    patch: {
      occupation: 'First created man, keeper of the Garden'
    }
  },
  {
    name: 'Eve',
    patch: {
      occupation: 'First created woman, mother of all living'
    }
  },
  {
    name: 'Keturah',
    patch: {
      occupation: 'Matriarch, wife of Abraham'
    }
  },
  {
    name: 'Noah',
    patch: {
      occupation: 'Patriarch, builder of the ark'
    }
  },
  {
    name: 'Seth',
    patch: {
      notable_events: [
        'Was born to Adam and Eve to continue the godly lineage after the death of Abel',
        'Established a godly line in which men began to call upon the name of the Lord'
      ]
    }
  },
  {
    name: 'Kenan',
    patch: {
      notable_events: [
        'Lived 910 years as an early patriarch in the godly lineage from Seth to Noah'
      ]
    }
  },
  {
    name: 'Mahalalel',
    patch: {
      notable_events: [
        'Lived 895 years as a forefather in the ancestral line of Noah'
      ]
    }
  },
  {
    name: 'Jared',
    patch: {
      notable_events: [
        'Lived 962 years as an early patriarch and father of Enoch in Genesis 5'
      ]
    }
  },
  {
    name: 'Methuselah',
    patch: {
      notable_events: [
        'Lived 969 years as the longest-lived man recorded in scripture'
      ]
    }
  },
  {
    name: 'Shem',
    patch: {
      notable_events: [
        'Received a special blessing from his father Noah and became ancestor of the Semitic nations'
      ]
    }
  },
  {
    name: 'Japheth',
    patch: {
      notable_events: [
        'Survived the Great Flood with Noah and was blessed to dwell in the tents of Shem',
        'Spread outward to become the forefather of the coastland and maritime peoples'
      ]
    }
  },
  {
    name: 'Terah',
    patch: {
      notable_events: [
        'Journeyed from Ur of the Chaldeans toward Canaan and settled in Haran with his family'
      ]
    }
  },
  {
    name: 'Hagar',
    patch: {
      notable_events: [
        'Encountered the Angel of the Lord at the spring in the wilderness, naming Him "The God Who Sees Me"'
      ]
    }
  },
  {
    name: 'Ishmael',
    patch: {
      notable_events: [
        'Was blessed by God in the desert and fathered twelve tribal rulers according to the divine promise'
      ]
    }
  },
  {
    name: 'Philip the Evangelist',
    patch: {
      notable_events: [
        'Was chosen as one of the seven deacons and preached the Gospel powerfully across Samaria',
        'Baptized the Ethiopian eunuch on the desert road to Gaza'
      ]
    }
  },
  {
    name: 'Cornelius',
    patch: {
      notable_events: [
        'Was a devout Roman centurion in Caesarea who prayed continually and gave generously to the needy',
        'Invited Peter to his home, where his entire Gentile household believed and received the Holy Spirit'
      ]
    }
  },
  {
    name: 'Timothy',
    patch: {
      notable_events: [
        'Accompanied Paul faithfully on missionary journeys and was charged with pastoring the church at Ephesus'
      ]
    }
  },
  {
    name: 'Adonijah',
    patch: {
      notable_events: [
        'Attempted to exalt himself as king during King David’s old age before Solomon was crowned'
      ]
    }
  },
  {
    name: 'Amaziah',
    patch: {
      notable_events: [
        'Defeated the Edomites in the Valley of Salt but later brought back and worshiped their false gods'
      ]
    }
  },
  {
    name: 'Asa',
    patch: {
      notable_events: [
        'Removed idolatrous high places in Judah but in his later years allied with the king of Aram instead of seeking the Lord'
      ]
    }
  },
  {
    name: 'Athaliah',
    patch: {
      notable_events: [
        'Usurped the throne of Judah by attempting to slaughter all royal heirs, until Joash was crowned and she was overthrown'
      ]
    }
  },
  {
    name: 'Mephibosheth',
    patch: {
      notable_events: [
        'Surviving lame son of Jonathan whom King David restored and invited to eat continually at the royal table'
      ]
    }
  },
  {
    name: 'Uriah the Hittite',
    patch: {
      notable_events: [
        'Valiant soldier in David\'s army who displayed unwavering loyalty to his troops at the front lines'
      ]
    }
  },
  {
    name: 'Delilah',
    patch: {
      notable_events: [
        'Enticed Samson to reveal the secret of his great strength to the Philistine lords'
      ]
    }
  },
  {
    name: 'Eliab',
    patch: {
      notable_events: [
        'Eldest brother of David who was initially presumed by Samuel to be the Lord\'s chosen king due to his stature'
      ]
    }
  },
  {
    name: 'Abner',
    patch: {
      notable_events: [
        'Commander of Saul\'s army who initially placed Ish-bosheth on the throne before seeking peace with David'
      ]
    }
  },
  {
    name: 'Matthias',
    patch: {
      notable_events: [
        'Was selected by lot after prayer among the believers to join the eleven apostles'
      ]
    }
  },
  {
    name: 'Lydia',
    patch: {
      notable_events: [
        'Seller of purple cloth from Thyatira whose heart the Lord opened at Philippi, leading to her household\'s baptism'
      ]
    }
  },
  {
    name: 'Simon of Cyrene',
    patch: {
      notable_events: [
        'Was compelled by Roman soldiers to carry the cross of Jesus on the way to Golgotha'
      ]
    }
  },
  {
    name: 'Jair',
    patch: {
      notable_events: [
        'Judged Israel for twenty-two years and had thirty sons who rode on thirty donkeys and ruled thirty cities'
      ]
    }
  },
  {
    name: 'Gomer',
    patch: {
      notable_events: [
        'Was taken as a wife by the prophet Hosea in an earthly marriage symbolizing God\'s enduring love for unfaithful Israel'
      ]
    }
  },
  {
    name: 'Andrew',
    patch: {
      notable_events: [
        'Was a disciple of John the Baptist who followed Jesus and immediately brought his brother Peter to the Messiah'
      ]
    }
  },
  {
    name: 'Simeon called Niger',
    patch: {
      notable_events: [
        'Served as a prophet and teacher in the diverse leadership team of the Antioch church'
      ]
    }
  },
  {
    name: 'Stephanas',
    patch: {
      notable_events: [
        'His household was the first fruits of Achaia, devoted to ministering to the saints'
      ]
    }
  }
];

let applied = 0;
updates.forEach(u => {
  const p = map.get(u.name);
  if (p) {
    Object.assign(p, u.patch);
    applied++;
  } else {
    console.warn('Could not find:', u.name);
  }
});

fs.writeFileSync(peoplePath, JSON.stringify(people, null, 2), 'utf8');
console.log(`Successfully updated and saved ${applied} people in ${peoplePath}`);

