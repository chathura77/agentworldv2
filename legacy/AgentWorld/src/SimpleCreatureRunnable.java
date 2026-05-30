/**
 * This class has got the attributes and the methods that a intelligent creature
 * has. An intelligent creature may move around in the grid world randomly when
 * it is in the observation mode, and otherwise it will make decisions according
 * the plants seen, creatures seen, and the plants that it carry.
 *
 *  Copyright (C) 2012 Chathura M. Sarathchandra Magurawalage.
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * 
 * @author Chathura M. Sarathchandra Magurawalage.
 *         77.chathura@gmail.com
 *         csarata@essex.ac.uk 
 */

package AgentWorld;

import java.util.Random;

public class SimpleCreatureRunnable implements Runnable {

    /**
     * The speed of the creature. The delay that occurs when the creature move
     */
    protected static final long DELAY = 25;

    /**
     * The creature that the Runnable instance belongs to
     */
    private final SimpleCreature simpleCreature;

    /**
     * The grid world
     */
    protected final Grid grid;

    /**
     * Stop time of an action.
     */
    protected boolean stop = false;

    /**
     * The number of moves
     */
    protected static final int NUM_OF_MOVES = 6;

    /**
     * The speed of the creature
     */
    private static final int ACTION_TIME = 5000;

    /**
     * Random number generator
     */
    protected Random ra;

    /**
     * The Constructor
     * 
     * @param simpleCreature
     * @param grid
     */
    public SimpleCreatureRunnable(SimpleCreature simpleCreature, Grid grid) {
	this.simpleCreature = simpleCreature;
	this.grid = grid;
	ra = new Random();

    }

    /**
     * The timer is not guaranteed to execute in the time that has been
     * specified
     * */
    @Override
    public void run() {
	try {
	    Random ra = new Random();
	    while (simpleCreature.isAlive()) {
		int acNumber = ra.nextInt(NUM_OF_MOVES);
		Thread th = new Thread(new Timer(ra.nextInt(ACTION_TIME)));
		th.setDaemon(true);
		th.start();
		doAction(acNumber);
		stop = false;
		grid.repaint();
	    }
	} catch (InterruptedException e) {
	    e.printStackTrace();
	}
    }

    /**
     * Move the creature according to the given action number
     * 
     * @param acNumber
     *            The action number
     * @throws InterruptedException
     *             If it fails to delay one step of an action
     */
    protected void doAction(int acNumber) throws InterruptedException {
	switch (acNumber) {
	case 0:
	    while (simpleCreature.isAlive() && simpleCreature.isRightMovable()
		   && !stop) {
		simpleCreature.moveRight();
		Thread.sleep(DELAY);
		grid.repaint();
	    }
	    if (!simpleCreature.isAlive() && !stop) {
		break;
	    }

	case 1:
	    while (simpleCreature.isAlive() && simpleCreature.isDownMovable()
		   && !stop) {
		simpleCreature.moveDown();
		Thread.sleep(DELAY);
		grid.repaint();
	    }
	    if (!simpleCreature.isAlive() && !stop) {
		break;
	    }

	case 2:
	    while (simpleCreature.isAlive() && simpleCreature.isLeftMovable()
		   && !stop) {
		simpleCreature.moveLeft();
		Thread.sleep(DELAY);
		grid.repaint();
	    }
	    if (!simpleCreature.isAlive() && !stop) {
		break;
	    }
	case 3:
	    while (simpleCreature.isAlive() && simpleCreature.isUpMovable()
		   && !stop) {
		simpleCreature.moveUp();
		Thread.sleep(DELAY);
		grid.repaint();
	    }
	    if (!simpleCreature.isAlive() && !stop) {
		break;
	    }
	case 4:
	    while (simpleCreature.isAlive() && simpleCreature.isUpMovable()
		   && simpleCreature.isRightMovable() && !stop) {
		simpleCreature.moveNorthEast();
		Thread.sleep(DELAY);
		grid.repaint();
	    }
	    if (!simpleCreature.isAlive() && !stop) {
		break;
	    }
	case 5:
	    while (simpleCreature.isAlive() && simpleCreature.isDownMovable()
		   && simpleCreature.isRightMovable() && !stop) {
		simpleCreature.moveSouthEast();
		Thread.sleep(DELAY);
		grid.repaint();
	    }
	    if (!simpleCreature.isAlive() && !stop) {
		break;
	    }
	case 6:
	    while (simpleCreature.isAlive() && simpleCreature.isUpMovable()
		   && simpleCreature.isLeftMovable() && !stop) {
		simpleCreature.moveNorthWest();
		Thread.sleep(DELAY);
		grid.repaint();
	    }
	    if (!simpleCreature.isAlive() && !stop) {
		break;
	    }
	default:
	    break;
	}
    }

    /**
     * This timer class has been used to time the amount of the energy
     * consumption of the creatures.
     * 
     * @author Chathura M. Sarathchandra Magurawalage
     * 
     */
    protected final class Timer implements Runnable {
	/**
	 * The delay
	 */
	int delay;

	/**
	 * The constructor
	 * 
	 * @param delay
	 *            The delay time
	 */
	public Timer(int delay) {
	    this.delay = delay;
	}

	@Override
	public void run() {

	    try {
		Thread.sleep(ra.nextInt(delay));
		stop = true;
	    } catch (InterruptedException e) {
		e.printStackTrace();
	    }
	}
    }
}
