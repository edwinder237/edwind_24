export const useQuery = {
    selectProjects: 'Select * from projects',
    selectProjectss: `SELECT  
      id,
      parent_Id,
      title,
      summary,
      duration,
      type,
      status,
      start_date,
      end_date,
      creation_date,
      eventsIds_JSON,
      JSON_ARRAY(pp.participant_id) AS particioants,
      groupsId_JSON,
      curriculumId_JSON
    FROM projects
    LEFT JOIN
     project_participants pp ON id = pp.project_id;
    
    `,
    
    insertProject: `
    INSERT INTO projects (
        id, title, parent_id, summary, duration, type, status,
        start_date, end_date, creation_date, eventsIds_JSON, participantsIds_JSON, groupsId_JSON, curriculumId_JSON
    )
    VALUES (
        '1815',
        'Hello from planet scale',
        4488,
        'introduction to the toolset',
        142,
        'onboarding',
        'active',
        '2023-02-15',
        '2023-12-26',
        '2023-01-10',
        'cal', -- Assuming cal is a variable or value you want to insert
        '[]', -- Assuming participants is an empty array
        '[]', -- Assuming groups is an empty array
        '[]' -- Assuming curriculum is a variable or value you want to insert
    )
    `,
    selectParticipants: "SELECT * FROM participants",
    insertProject: `
    INSERT INTO projects (
        id, title, parent_id, summary, duration, type, status,
        start_date, end_date, creation_date, eventsIds_JSON, participantsIds_JSON, groupsId_JSON, curriculumId_JSON
    )
    VALUES (
        '1815',
        'Hello from planet scale',
        4488,
        'introduction to the toolset',
        142,
        'onboarding',
        'active',
        '2023-02-15',
        '2023-12-26',
        '2023-01-10',
        'cal', -- Assuming cal is a variable or value you want to insert
        '[]', -- Assuming participants is an empty array
        '[]', -- Assuming groups is an empty array
        '[]' -- Assuming curriculum is a variable or value you want to insert
    )
    `,
};
