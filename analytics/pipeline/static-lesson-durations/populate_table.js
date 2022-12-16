const { getCourseNames } = require('../lt_utils');
const getClient = require('../client_utils');
const fetch = require('node-fetch');

const run = async () => {
  const client = await getClient();
  for (const course of getCourseNames()) {
    const currentMeta = await fetch(`https://downloads.languagetransfer.org/${course}-meta.json`).then(r => r.json());

    // so here's a fun fact, turns out i DID start counting from zero, and all the versions got bumped when i added filesizes or whatever.
    // this script is wrong, doesn't have the 0 metadatas

    let i = 0;
    for (const lesson of currentMeta.lessons) {
      await client.query(`
        INSERT INTO static_lesson_durations
        (lesson_id, course, lesson_index, metadata_version, duration)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, [ lesson.id, course, i, currentMeta.version, lesson.duration ]);
      i++;
    }

    console.log(course, 'finished for current meta version');

    if (course === 'turkish') {
      // 34 got replaced in metadata v2
      let i = 0;
      for (const lesson of currentMeta.lessons) {
        if (lesson.id !== 'turkish34-2') {
          await client.query(`
            INSERT INTO static_lesson_durations
            (lesson_id, course, lesson_index, metadata_version, duration)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT DO NOTHING
          `, [ lesson.id, course, i, 1, lesson.duration ]);
        } else {
          await client.query(`
            INSERT INTO static_lesson_durations
            (lesson_id, course, lesson_index, metadata_version, duration)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT DO NOTHING
          `, [ 'turkish34', course, i, 1, 661.19 ]);
        }
        i++;
      }
    } else if (course === 'music') {
      // we on metadata v9 smh
      for (const version of [1, 2, 3, 4, 5, 6, 7, 8]) {
        await client.query(`
          INSERT INTO static_lesson_durations
          (lesson_id, course, lesson_index, metadata_version, duration)
            SELECT lesson_id, course, lesson_index, $1 metadata_version, duration
            FROM static_lesson_durations
            WHERE course = 'music' and metadata_version = '9';
        `, [ version ]); // lol
      }
    }
  }
  process.exit(0);
};

run();
