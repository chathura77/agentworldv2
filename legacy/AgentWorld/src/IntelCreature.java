/**
 * This class is the intelligent creature and has got its methods. The
 * intelligent creature is more intelligent than a Simple creature. It can talk
 * to other intelligent creatures and make agreements on combinations according
 * to the plants that the both creature carry, then share the amount of
 * utility/energy. Or make agreements on the plants that the one creature has
 * made and decides to share the utility/amount by taking the plant together.
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
 *
 * @author Chathura M. Sarathchandra Magurawalage
 *         77.chathura@gmail.com
 *         csarata@essex.ac.uk
 * 
 */


package AgentWorld;

import java.awt.Color;
import java.awt.Graphics;
import java.awt.Point;
import java.awt.geom.Rectangle2D;
import java.util.Collections;
import java.util.ConcurrentModificationException;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Vector;

@SuppressWarnings("serial")
public final class IntelCreature extends SimpleCreature {

    /**
     * The limit the creature waits until it eats
     */
    protected static final int PLANT_EAT_LIMIT = 50;

    /**
     * The amount of energy that it will loose each time it moves to another
     * square
     */
    private static final int DIFF_SQUARE_ENERGY_CONS_AMOUNT = 15;

    /**
     * The amount of energy that it will loose each time it is in the same
     * square as it is.
     */
    private static final int ENERGY_CONS_AMOUNT = 10;

    /**
     * The plants that the creature has got in its memory
     */
    protected final LinkedList<Plant> plantsSeen = new LinkedList<Plant>();
    /**
     * The creatures that the creature has seen
     */
    protected final LinkedList<SimpleCreature> creaturesSeen = new LinkedList<SimpleCreature>();
    /**
     * The number of plants that the creature can memorise.
     */
    protected static int PLANT_MEMORY = 20;
    /**
     * The number of creatures that the creature can memorise.
     */
    protected static int CREATURE_MEMORY = 20;
    /**
     * The creatures desired plant
     */
    private Plant dPlant = null;
    /**
     * The plants that the creature can carry
     */
    protected static int PLANT_LIMIT = 4;

    /**
     * True, if the creature is a partner, otherwise false.
     */
    private boolean isAPartner = false;
    /**
     * Null if the creature has not got a partner. Else the reference to the
     * partner creature
     */
    protected IntelCreature partner = null;
    /**
     * The creatures desired combination. -1 = null
     */
    private int desiredCombo = -1;
    /**
     * The requested plant
     */
    private Plant requestedPlant = null;
    /**
     * if the creature is a partner, the leader will be assigned
     */
    private IntelCreature leader;

    /**
     * The constructor
     * 
     * @param point
     *            The start position of the creature
     * @param bounds
     *            The bounds of the world
     */
    public IntelCreature(Point point, Rectangle2D bounds) {
	super(point, bounds);
	getCloseCreatures();
	watchCreatures(this);
    }

    /**
     * Look for the creatures and make partnerships with them if they agree to
     * 
     * @param thisCreature
     *            A reference to "this" creature
     */
    private void watchCreatures(final IntelCreature thisCreature) {
	Thread cWatcher = new Thread(new Runnable() {

		@SuppressWarnings("unchecked")
		@Override
		public void run() {

		    while (isAlive()) {

			setCreatureDefaults();

			if (hasPartner() && getDesiredCombo() == -1) {
			    WorldFrame.log.append("Intel Creature "
						  + getCreautreNumber()
						  + " Dispartnering..combo " + getDesiredCombo()
						  + "does not exist anymore " + "\n");
			    IntelCreature c = getPartner();
			    c.setAsPartner(false);
			    c.removeLeader();
			    disPartner();
			    removeDesiredPlant();
			    removeRequestedPlant();
			    System.out
				.println("Dispartnering..combo does not exist");

			    continue;
			}

			synchronized (creaturesSeen) {

			    LinkedList<SimpleCreature> cr = null;
			    while (cr == null) {
				try {
				    cr = (LinkedList<SimpleCreature>) creaturesSeen
					.clone();
				} catch (ConcurrentModificationException e) {
				    continue;
				} catch (NullPointerException e) {
				    continue;
				}
			    }

			    for (Iterator<SimpleCreature> it = cr.iterator(); it
				     .hasNext();) {
				SimpleCreature simpleC = it.next();
				IntelCreature inCr = null;

				if (simpleC.getClass().equals(IntelCreature.class)) {
				    inCr = (IntelCreature) simpleC;
				}

				if (inCr != null
				    && isInSameSquare(inCr.getPosition())) {

				    // ADDED: only request for a combo if both
				    // creatures that are not partners or leaders.
				    if (!hasPartner() || !isAPartner()
					|| !inCr.hasPartner()
					|| !inCr.isAPartner) {
					getComboplants(thisCreature, inCr);
				    }

				    int combo = inCr.getDesiredCombo();
				    if (combo != -1) {
					int cA = getComboAmount(combo);
					if (cA > 400) {
					    Plant desiredPlant = inCr
						.getCurrentDesiredPlant();
					    if (inCr.requestCompanionship(
									  thisCreature, combo,
									  desiredPlant, cA / 2)) {

						inCr.addPartner(thisCreature);
						setRequestedPlant(desiredPlant);
						setLeader(inCr);
						setAsPartner(true);
						System.out
						    .println("hey we are partners");
						WorldFrame.log.append("Intel Creature "
								      + getCreautreNumber()
								      + " is partner with, "
								      + inCr.getCreautreNumber()
								      + " as leader" + "\n");
					    }
					}
				    }
				}
			    }
			}
		    }
		}
	    });
	cWatcher.setDaemon(true);
	cWatcher.start();
    }

    /**
     * Sets the default parameters of the creature
     */
    protected void setCreatureDefaults() {
	if (!isAPartner) {

	    if (requestedPlant != null) {
		setRequestedPlant(null);
	    }

	    if (leader != null) {
		setLeader(null);
	    }
	}
	if (!hasPartner()) {

	    if (partner != null) {
		disPartner();
	    }

	    if (dPlant != null) {
		removeDesiredPlant();
		removeRequestedPlant();
	    }

	    if (desiredCombo != -1) {
		setDesiredCombo(-1);
	    }
	}
    }

    /**
     * Remove the leader
     */
    protected void removeLeader() {
	leader = null;
    }

    /**
     * Sets the leader
     * 
     * @param lCreature
     *            The leader
     */
    protected synchronized void setLeader(IntelCreature lCreature) {
	leader = lCreature;

    }

    /**
     * Get the leader
     * 
     * @return The leader
     */
    protected synchronized IntelCreature getLeader() {
	return leader;
    }

    /**
     * Set the requested plant
     * 
     * @param reqPlant
     *            The requested plant
     */
    private synchronized void setRequestedPlant(Plant reqPlant) {
	requestedPlant = reqPlant;
    }

    /**
     * Add the partner
     * 
     * @param thisCreature
     *            The partner
     */
    protected synchronized void addPartner(IntelCreature thisCreature) {
	partner = thisCreature;
    }

    /**
     * Gets request for a companionship from another intel creature
     * 
     * @param creature
     *            The creature
     * @param combo
     *            the combination that the creature is interested in
     * @param currentDesiredPlant
     *            The plant that the creature is interested in
     * @param amount
     *            The amount of energy that the creature is interested in
     * @return true, if the creature is happy to make a partnership, else false
     */
    protected synchronized boolean requestCompanionship(IntelCreature creature,
							int combo, Plant currentDesiredPlant, int amount) {
	if (!hasPartner() && !isAPartner() && !creature.isAPartner()
	    && combo == getDesiredCombo()
	    && amount >= (getComboAmount(combo) / 2)
	    && currentDesiredPlant == getCurrentDesiredPlant()) {
	    WorldFrame.log.append("Intel Leader Creature "
				  + getCreautreNumber() + " Companionship with creature "
				  + creature.getCreautreNumber() + " has been accepted\n");
	    return true;
	}
	return false;
    }

    /**
     * Set the creature as a partner
     * 
     * @param b
     *            true if is a partner, false not a partner(remove partnership)
     */
    protected synchronized void setAsPartner(boolean b) {
	System.out.println("Making partner as " + b);
	isAPartner = b;
    }

    /**
     * Check if the this creature is a partner
     * 
     * @return true if is a partner, otherwise return false.
     */
    protected synchronized boolean isAPartner() {
	return isAPartner;
    }

    /**
     * Get the the desired combinations of the plant according the desired plant
     * and request it from the creature
     * 
     * @param thisCreature
     *            This creature
     * @param inCr
     *            The creature that the partnership is going to be requested
     *            from
     * */

    private void getComboplants(IntelCreature thisCreature, IntelCreature inCr) {

	Plant desiredPlant = IntelCreatureRunnable.getNextDesiredPlant(
								       thisCreature, plants, inCr.getPlants(), true);

	int amount = 0;
	Plant tempP = null;

	if (desiredPlant != null) {

	    List<Plant> plantsList = Collections
		.synchronizedList(thisCreature.plants);
	    synchronized (thisCreature.plants) {
		for (Iterator<Plant> ite = plantsList.iterator(); ite.hasNext();) {

		    try {
			tempP = ite.next();

		    } catch (ConcurrentModificationException e) {
			// if the plant has already been
			// taken then move on to the
			// next one
			continue;
		    }

		    if ((tempP.getType() == Plant.GREEN_PLANT && desiredPlant
			 .getType() == Plant.RED_PLANT)
			|| (tempP.getType() == Plant.RED_PLANT && desiredPlant
			    .getType() == Plant.GREEN_PLANT)) {
			amount = SimpleCreature.COMBO_ONE_AMOUNT;
			break;
		    }
		    if ((tempP.getType() == Plant.YELLOW_PLANT && desiredPlant
			 .getType() == Plant.RED_PLANT)
			|| (tempP.getType() == Plant.RED_PLANT && desiredPlant
			    .getType() == Plant.YELLOW_PLANT)) {
			amount = SimpleCreature.COMBO_TWO_AMOUNT;
			break;
		    }
		    if ((tempP.getType() == Plant.MAGENTA_PLANT && desiredPlant
			 .getType() == Plant.YELLOW_PLANT)
			|| (tempP.getType() == Plant.YELLOW_PLANT && desiredPlant
			    .getType() == Plant.MAGENTA_PLANT)) {
			amount = SimpleCreature.COMBO_THREE_AMOUNT;
			break;
		    }
		}
		if (inCr.requestCombo(desiredPlant, amount * 2)) {
		    WorldFrame.log
			.append("Intel Creature "
				+ getCreautreNumber()
				+ ": The Combination has been accepted by creature "
				+ inCr.getCreautreNumber() + "\n");
		    thisCreature.plants.remove(tempP);
		    gainEnergy(amount * 2);
		} else {
		    WorldFrame.log
			.append("Intel Creature "
				+ getCreautreNumber()
				+ ": The Combination has been rejected by creature "
				+ inCr.getCreautreNumber() + "\n");
		}
	    }
	}
    }

    @Override
    protected void getClosePlants() {
	Thread plRadarThread = new Thread(new Runnable() {
		@SuppressWarnings("unchecked")
		@Override
		public void run() {

		    try {// wait until the plants align properly
			Thread.sleep(80);
		    } catch (InterruptedException e) {
			e.printStackTrace();
		    }

		    // True if this creature is alive
		    while (isAlive()) {
			// clone the Grid.plants, the centralised repository of
			// plants, so there will less concurrent conflict

			final Vector<Plant> pla;
			synchronized (Grid.plants) {
			    pla = (Vector<Plant>) Grid.plants.clone();

			    for (Iterator<Plant> iterator = pla.iterator(); iterator
				     .hasNext();) {

				try {
				    // concurrent modification error occurs
				    Plant plant = iterator.next();

				    // If the plant is the leaders, then leave it
				    if (isAPartner) {
					if (plant.equals(getRequestedPlant())) {
					    continue;
					}
				    }
				    Point pos = plant.getPosition();

				    if (isInRange(pos)) {

					if (plants.size() < PLANT_LIMIT
					    && isInSameSquare(pos)) {

					    setPosition(pos);
					    plant.take();
					    plants.add(plant);
					    iterator.remove();

					    synchronized (Grid.plants) {
						// assigns the remaining plants to
						// the main plant repository
						Grid.plants = pla;
					    }

					    // only add the plants that has been
					    // seen to the list, if it has not got
					    // it in the list already
					} else if (plantsSeen != null
						   && plant != null
						   && !plantsSeen.contains(plant)) {
					    if (plantsSeen.size() > PLANT_MEMORY) {
						plantsSeen.removeFirst();
					    }
					    plantsSeen.add(plant);
					}
				    }
				    // if an agent has already got the plant, then
				    // try the next one
				} catch (ConcurrentModificationException e2) {
				    continue;
				} catch (NullPointerException e) {
				    continue;
				}
			    }
			}
		    }
		}
	    });
	plRadarThread.setDaemon(true);
	plRadarThread.start();
    }

    /**
     * Get all close creatures and remember them, if it is visible
     */
    protected void getCloseCreatures() {
	Thread creatureRadarThread = new Thread(new Runnable() {
		@Override
		public void run() {

		    try {// wait until the plants align properly
			Thread.sleep(80);
		    } catch (InterruptedException e) {
			e.printStackTrace();
		    }

		    // True if this creature is alive
		    while (isAlive()) {

			// clone the Grid.plants, the centralised repository of
			// plants, so there will less concurrent conflict

			synchronized (Grid.simpleCreatures) {
			    List<SimpleCreature> cre = Collections
				.synchronizedList(Grid.simpleCreatures);
			    for (Iterator<SimpleCreature> iterator = cre.iterator(); iterator
				     .hasNext();) {

				SimpleCreature creature = iterator.next();

				Point pos = creature.getPosition();

				if (isInRange(pos)
				    && creature.getCreautreNumber() != getCreautreNumber()) {

				    if (creaturesSeen != null && creature != null
					&& !creaturesSeen.contains(creature)) {
					if (creaturesSeen.size() > CREATURE_MEMORY) {
					    creaturesSeen.removeFirst();
					}
					creaturesSeen.add(creature);
				    }
				}
			    }
			}
		    }
		}
	    });
	creatureRadarThread.setDaemon(true);
	creatureRadarThread.start();
    }

    @Override
    protected void countEnergy() {
	Thread timer = new Thread(new Runnable() {

		@Override
		public void run() {
		    while ((energy > 0 && isAlive())
			   || (plants.size() > 0 && energy > 0 && isAlive())) {

			if (hasPartner()) {// true if creature is a leader

			    int c = getDesiredCombo();
			    System.out.println("I am going to eat desiredc "
					       + c
					       + " partner "
					       + getPartner().getEnergy()
					       + " me "
					       + getEnergy()
					       + " got plant "
					       + plants.contains(getCurrentDesiredPlant())
					       + " has plant "
					       + Grid.plants
					       .contains(getCurrentDesiredPlant())
					       + " ptype ");
			    // + getCurrentDesiredPlant().getType());

			    // If a partner and if the plant does not exist anymore
			    // or the
			    // leader is not alive leave the partnership
			    if ((hasPartner() && !getPartner().isAlive())
				|| (!plants.contains(getCurrentDesiredPlant()) && !Grid.plants
				    .contains(getCurrentDesiredPlant()))) {
				WorldFrame.log
				    .append("Intel Creature "
					    + getCreautreNumber()
					    + " The partnership ended with "
					    + getPartner().getCreautreNumber()
					    + " because the plant does not exist anymore \n");
				System.out
				    .println("The partnership ended because the plant does not exist anymore");

				if (getPartner().isAlive()) {
				    getPartner().setAsPartner(false);
				    getPartner().removeLeader();
				}
				disPartner();
				removeDesiredPlant();
				removeRequestedPlant();
				continue;
			    }

			    System.out.println("The combination " + c + " is "
					       + isCombination(c));

			    if (isCombination(c)) {
				System.out.println("I am going to eat now " + c);
				if (c == COMBO_ONE) {
				    eatCombinationOne();
				}
				if (c == COMBO_TWO) {
				    eatCombinationTwo();
				}
				if (c == COMBO_THREE) {
				    eatCombinationThree();
				}
			    } else {
				if (getEnergy() < PLANT_EAT_LIMIT
				    && plants.size() > 0) {

				    if (plants.size() > 1) {
					synchronized (plants) {
					    List<Plant> list = Collections
						.synchronizedList(plants);
					    for (Iterator<Plant> it = list
						     .iterator(); it.hasNext();) {
						Plant p = it.next();
						if ((getCurrentDesiredPlant()
						     .getType() == Plant.GREEN_PLANT && p
						     .getType() == Plant.RED_PLANT)
						    || (getCurrentDesiredPlant()
							.getType() == Plant.RED_PLANT && (p
											  .getType() == Plant.GREEN_PLANT || p
											  .getType() == Plant.YELLOW_PLANT))) {
						    continue;
						} else if (getCurrentDesiredPlant()
							   .getType() == Plant.YELLOW_PLANT
							   && (p.getType() == Plant.RED_PLANT || p
							       .getType() == Plant.MAGENTA_PLANT)) {
						    continue;
						} else if (getCurrentDesiredPlant()
							   .getType() == Plant.MAGENTA_PLANT
							   && p.getType() == Plant.YELLOW_PLANT) {
						    continue;
						}

						System.out
						    .println("I am a leader eating a plant");
						WorldFrame.log
						    .append("Leader Creature "
							    + getCreautreNumber()
							    + " eating the plant of type "
							    + p.getType()
							    + "\n");

						energy += p.getEnergy();
						it.remove();
						break;
					    }
					}
				    } else {
					System.out
					    .println("I am a leader and going to dispartner");

					WorldFrame.log
					    .append("Intel Leader Creature "
						    + getCreautreNumber()
						    + " has been dispartnered with "
						    + getPartner()
						    .getCreautreNumber()
						    + "\n");

					getPartner().setAsPartner(false);
					getPartner().removeLeader();
					disPartner();
					removeDesiredPlant();
					removeRequestedPlant();
					System.out.println("Dispartnered");
					Plant first = plants.poll();
					energy += first.getEnergy();
					continue;
				    }
				}
			    }
			    // food for normal intel creature
			} else if (getEnergy() < 50 && !isAPartner) {

			    System.out
				.println("I am a normal creature going to eat");
			    if (isCombination(COMBO_ONE)) {
				eatCombinationOne();
			    } else if (isCombination(COMBO_TWO)) {
				eatCombinationTwo();
			    } else if (isCombination(COMBO_THREE)) {
				eatCombinationThree();
			    } else {
				if (plants.size() > 0) {
				    Plant first = plants.poll();
				    WorldFrame.log.append("intel Creature "
							  + getCreautreNumber()
							  + " is eating the plant of type "
							  + first.getType() + "\n");
				    energy += first.getEnergy();
				}
			    }
			}

			// food for partners
			if (isAPartner && plants.size() > 0 && energy < 50) {
			    synchronized (plants) {
				List<Plant> list = Collections
				    .synchronizedList(plants);

				for (Iterator<Plant> it = list.iterator(); it
					 .hasNext();) {
				    Plant p = it.next();
				    if (!p.equals(getRequestedPlant())) {
					System.out
					    .println("I am a partner creature going to eat");
					WorldFrame.log
					    .append("Intel Partner Creature "
						    + getCreautreNumber()
						    + " is eating the plant of type "
						    + p.getType() + "\n");
					energy += p.getEnergy();
					break;
				    }
				}
			    }
			}

			try {
			    Thread.sleep(1000);
			} catch (InterruptedException e) {
			    e.printStackTrace();
			}
			// if the creature moves to a different square the energy
			// level goes down more
			if (isSquareChanged()) {
			    energy -= DIFF_SQUARE_ENERGY_CONS_AMOUNT;
			} else {
			    energy -= ENERGY_CONS_AMOUNT;
			}
		    }
		    kill();
		}
	    });
	timer.setDaemon(true);
	timer.start();
    }

    /**
     * Remove the desired plants
     */
    private void removeDesiredPlant() {
	dPlant = null;

    }

    /**
     * Get the requested plant
     * 
     * @return The requested plant
     */
    private Plant getRequestedPlant() {
	return requestedPlant;
    }

    /**
     * Remove the requested plant
     */
    private void removeRequestedPlant() {
	requestedPlant = null;
    }

    @Override
    protected void eatCombinationThree() {
	int magenta = 0;
	int yellow = 0;
	for (Iterator<Plant> it = plants.iterator(); it.hasNext();) {
	    Plant pl = it.next();

	    if (pl.getType() == Plant.MAGENTA_PLANT && magenta < 1) {
		it.remove();
		magenta++;
	    }
	    if (pl.getType() == Plant.YELLOW_PLANT && yellow < 1) {
		it.remove();
		yellow++;
	    }

	    if (magenta == 1 && yellow == 1) {
		break;
	    }
	}
	if (hasPartner()) {
	    energy += (COMBO_THREE_AMOUNT * 2);
	    IntelCreature c = getPartner();
	    c.gainEnergy(COMBO_THREE_AMOUNT * 2);
	    c.setAsPartner(false);
	    c.removeLeader();
	    disPartner();
	    removeDesiredPlant();
	    removeRequestedPlant();

	} else {

	    System.out.println("I am going to eat combo 3 - non leader");
	    WorldFrame.log.append("Intel Creature " + getCreautreNumber()
				  + " ete a combination three \n");
	    energy += COMBO_THREE_AMOUNT;
	    WorldFrame.log.append("Intel Leader Creature "
				  + getCreautreNumber() + " ete a combination three \n");
	}
    }

    @Override
    protected void eatCombinationTwo() {
	int yellow = 0;
	int red = 0;
	for (Iterator<Plant> it = plants.iterator(); it.hasNext();) {
	    Plant pl = it.next();

	    if (pl.getType() == Plant.YELLOW_PLANT && yellow < 1) {
		it.remove();
		yellow++;
	    }
	    if (pl.getType() == Plant.RED_PLANT && red < 1) {
		it.remove();
		red++;
	    }

	    // stops looping than required
	    if (yellow == 1 && red == 1) {
		break;
	    }
	}

	if (hasPartner()) {
	    energy += (COMBO_TWO_AMOUNT * 2);
	    IntelCreature c = getPartner();
	    c.gainEnergy(COMBO_TWO_AMOUNT * 2);
	    c.setAsPartner(false);
	    c.removeLeader();
	    disPartner();
	    removeDesiredPlant();
	    removeRequestedPlant();
	    WorldFrame.log.append("Intel Leader Creature "
				  + getCreautreNumber() + " ete a combination two \n");

	} else {
	    System.out.println("I am going to eat combo 2 - non leader");
	    energy += COMBO_TWO_AMOUNT;
	    System.out.println("The combo 2 " + energy);
	    WorldFrame.log.append("Intel Creature " + getCreautreNumber()
				  + " ete a combination two \n");
	}
    }

    @Override
    protected void eatCombinationOne() {
	int green = 0;
	int red = 0;
	for (Iterator<Plant> it = plants.iterator(); it.hasNext();) {
	    Plant pl = it.next();

	    if (pl.getType() == Plant.GREEN_PLANT && green < 1) {
		it.remove();
		green++;
	    }
	    if (pl.getType() == Plant.RED_PLANT && red < 1) {
		it.remove();
		red++;
	    }

	    // stops looping than required
	    if (green == 1 && red == 1) {
		break;
	    }

	}

	if (hasPartner()) {
	    energy += (COMBO_ONE_AMOUNT * 2);
	    IntelCreature c = getPartner();
	    c.gainEnergy(COMBO_ONE_AMOUNT * 2);
	    c.setAsPartner(false);
	    c.removeLeader();
	    disPartner();
	    removeDesiredPlant();
	    removeRequestedPlant();
	    WorldFrame.log.append("Intel Leader Creature "
				  + getCreautreNumber() + " ete a combination one \n");

	} else {
	    System.out.println("I am going to eat combo 1 - non leader");
	    energy += COMBO_ONE_AMOUNT;
	    System.out.println("The combo 1 " + energy);
	    WorldFrame.log.append("Intel Creature " + getCreautreNumber()
				  + " ete a combination one \n");
	}
    }

    /**
     * Check if the plant is in range ie. if the plant is visible
     * 
     * @param plantPos
     *            The plant
     * @return true, if the plant is in range, otherwise false.
     */
    protected boolean isInRange(Point plantPos) {

	Point cPos = getCurrentSquare(p);

	if (plantPos != null) {

	    Point pPos = getCurrentSquare(plantPos);

	    return super.isPlantInRange(plantPos)
		|| (cPos.getX() == pPos.getX() - 100
		    || cPos.getX() == pPos.getX() + 100 || cPos.getX() == pPos
		    .getX())
		&& (cPos.getY() == pPos.getY() - 100 || cPos.getY() == pPos
		    .getY() + 100) || cPos.getY() == pPos.getY();
	}
	return false;
    }

    /**
     * Wrapper method for the super.isPlantInRange()
     * 
     * @param Pos
     *            The position of the creature / plant
     * 
     * @return true if it is in the same square as the creature, otherwise
     *         return false
     */
    protected boolean isInSameSquare(Point Pos) {
	return super.isPlantInRange(Pos);
    }

    @Override
    public void paintComponent(Graphics g) {
	g.setColor(Color.DARK_GRAY);
	g.fillOval((int) p.getX(), (int) p.getY(), (int) width, (int) height);

	if (isAPartner()) {
	    g.setColor(Color.YELLOW);
	} else if (hasPartner()) {
	    g.setColor(Color.YELLOW.darker());
	} else {
	    g.setColor(Color.RED);
	}
	g.fillOval((int) p.getX() + 2, (int) p.getY() + 2, (int) width - 5,
		   (int) height - 5);
    }

    /**
     * Get a copy of the plants that the creature carry
     * 
     * @return The List of plants
     */
    public synchronized LinkedList<Plant> getPlants() {
	synchronized (plants) {
	    return (LinkedList<Plant>) plants.clone();
	}
    }

    /**
     * Request for a combinations
     * 
     * @param plant
     *            The plant that is interested in
     * @param amount
     *            The amount that the other creature is interested in sharing
     * @return true, if the combination is accepted, otherwise false.
     */
    public synchronized boolean requestCombo(Plant plant, int amount) {
	if (!hasPartner() && !isAPartner && plants.contains(plant)
	    && amount > 199) {
	    WorldFrame.log.append("Intel Creature " + getCreautreNumber()
				  + " combo request received \n");
	    plants.remove(plant);
	    gainEnergy(amount);
	    return true;
	}
	return false;
    }

    /**
     * Get the current desired plants
     * 
     * @return The desired plant
     */
    public synchronized Plant getCurrentDesiredPlant() {
	return dPlant;
    }

    /**
     * Set the desired plant
     * 
     * @param plant
     *            the plant
     */
    public synchronized void setDesiredPlant(Plant plant) {
	if (plant != null)
	    System.out.println("A desired plant has been set "
			       + plant.getType());

	dPlant = plant;
    }

    /**
     * The amount of energy that will gain for the given combo
     * 
     * @param c
     *            The combo number
     * @return The amount
     */
    public int getComboAmount(int c) {
	if (c == SimpleCreature.COMBO_ONE) {
	    return SimpleCreature.COMBO_ONE_AMOUNT;
	}
	if (c == SimpleCreature.COMBO_TWO) {
	    return SimpleCreature.COMBO_TWO_AMOUNT;
	}
	if (c == SimpleCreature.COMBO_THREE) {
	    return SimpleCreature.COMBO_TWO_AMOUNT;
	}

	return -1;
    }

    /**
     * Remove the creature itself as a the partner
     */
    public synchronized void disPartner() {
	partner = null;
    }

    /**
     * Check if the creature itself is a leader/ has got a partner
     * 
     * @return true, if is a leader, false otherwise
     */
    public synchronized boolean hasPartner() {
	return partner != null;
    }

    /**
     * Get the partner creature
     * 
     * @return The partner creature
     */
    public synchronized IntelCreature getPartner() {
	return partner;
    }

    /**
     * Gain energy
     * 
     * @param amount
     *            The amount of energy
     */
    protected synchronized void gainEnergy(int amount) {
	energy += amount;
    }

    /**
     * Get the desired combo type
     * 
     * @return The desired combo type
     */
    public synchronized int getDesiredCombo() {
	return desiredCombo;
    }

    /**
     * Set the desired combo
     * 
     * @param comboType
     *            The combo type
     */
    public synchronized void setDesiredCombo(int comboType) {
	System.out.println("Setting desired combo to " + comboType);
	desiredCombo = comboType;
    }
}
