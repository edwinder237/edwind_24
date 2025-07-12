// third-party
import { v4 as UIDV4 } from "uuid";

// ==============================|| CALENDAR - EVENT ADD ||============================== //

export default async function handler(req, res) {
  try {
    const { newEvent, events } = req.body;
    const { allDay, description, color, textColor, end, start, title } =
      newEvent;
    const event = {
      id: UIDV4(),
      allDay,
      description,
      color,
      textColor,
      end,
      start,
      title,
    };

    const Events = [...events,newEvent]

    res.status(200).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}
