import { adminOnly } from './../middlewares/auth.js';
import express from 'express';
import { deleteUser, getAllUsers, getUser, newUser } from '../controllers/user.js';

const app=express.Router();

app.post('/new',newUser);

app.get('/all',adminOnly,getAllUsers);

// these 2 api sortly written as 
// app.get('/:id',getUser);
// app.delete('/:id',deleteUser);

app.route("/:id").get(getUser).delete(adminOnly,deleteUser);

 
export default app;
