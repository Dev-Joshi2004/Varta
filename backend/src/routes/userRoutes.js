import { Router } from "express";
import { addMeetingToHistory, getUserHistory, login, register } from "../controllers/user.controller.js";

const router = Router();

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/add_to_activity").post(addMeetingToHistory);
router.route("/get_all_activity").post(getUserHistory);

export default router;