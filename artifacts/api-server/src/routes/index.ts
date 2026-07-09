import { Router, type IRouter } from "express";
import healthRouter from "./health";
import universitiesRouter from "./universities";
import facultiesRouter from "./faculties";
import programsRouter from "./programs";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(universitiesRouter);
router.use(facultiesRouter);
router.use(programsRouter);
router.use(statsRouter);

export default router;
