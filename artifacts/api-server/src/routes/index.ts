import { Router, type IRouter } from "express";
import healthRouter from "./health";
import universitiesRouter from "./universities";
import facultiesRouter from "./faculties";
import programsRouter from "./programs";
import statsRouter from "./stats";
import inquiriesRouter from "./inquiries";
import authRouter from "./auth";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(universitiesRouter);
router.use(facultiesRouter);
router.use(programsRouter);
router.use(statsRouter);
router.use(inquiriesRouter);
router.use("/admin", adminRouter);

export default router;
