import express from 'express'
import { adminOnly } from '../middlewares/auth.js'
import { getBarCharts, getDashBoardState, getLineCharts, getPieCharts } from '../controllers/stats.js';

const app=express.Router();

app.get('/stats',getDashBoardState);

app.get('/pie',getPieCharts);

app.get('/bar',getBarCharts);

app.get('/line',getLineCharts);

export default app;