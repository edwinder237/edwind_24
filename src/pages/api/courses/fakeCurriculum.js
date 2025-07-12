export const curriculum = [

    {
        uuid: "f500f6da-4053-11ee-be56-0242ac120002",
        title: "CRM PRO SUITE - w/Campaign",
        description: "Full package",
        courses: [],
        duration: 67.5,
    },
    {
        uuid: "f500f6da-4ed3-11ee-be56-0242ac128502",
        title: "CRM PRO SUITE",
        description: "CRm and desking",
        courses: [],
        duration: 60,
    },
    {
        uuid: "f500f6da-4ed3-11ee-be56-024hhc120002",
        title: "DESKING 360",
        description: "Intro to desking",
        courses: [],
        duration: 37.5,
    },
    {
        uuid: "f5ggf6da-4ed3-11ee-be56-0242ac120002",
        title: "CRM PRO",
        description: "Introduction to CRM",
        courses: [],
        duration: 15,
    },
    {
        uuid: "f5ssf6da-4ed3-11ee-be56-0242ac120002",
        title: "CRM MOBILE",
        description: "Introduction to CRM",
        courses: [],
        duration: 7.5,
    },


]

export default function handler(req, res) {
    return res.status(200).json({ curriculums: curriculum });
}