import { Router, type IRouter } from "express";
import { requireAdmin } from "../../middleware/requireAdmin";
import dashboardRouter from "./dashboard";
import usersRouter from "./users";
import universitiesRouter from "./universities";
import programsRouter from "./programs";
import tasksRouter from "./tasks";
import settingsRouter from "./settings";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(requireAdmin);
router.use(dashboardRouter);
router.use(usersRouter);
router.use(universitiesRouter);
router.use(programsRouter);
router.use(tasksRouter);
router.use(settingsRouter);
router.use(statsRouter);

export default router;
