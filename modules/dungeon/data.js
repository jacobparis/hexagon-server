module.exports = {

    "cards": [
        {
            "type": "monster",
            "name": "Rat",
            "body": "A cute little mouse",
            "stats": {
                "def": [2],
                "atk": [2]
            }
        },
        {
            "type": "monster",
            "name": "Bat",
            "body": "A cute little bird",
            "stats": {
                "def": [1, 1],
                "atk": [2, 1]
            }
        },
        {
            "type": "monster",
            "name": "Hatfright",
            "body": "A monster wearing a hat!",
            "stats": {
                "def": [4],
                "atk": [4]
            }
        },
        {
            "type": "monster",
            "name": "Dropbear",
            "body": "A bear that hides in trees, ready to drop on unsuspecting prey",
            "stats": {
                "def": [5, 3],
                "atk": [6, 2, 2]
            }
        },
        {
            "type": "monster",
            "name": "Flatbear",
            "body": "They blow in on the northerlies",
            "stats": {
                "def": [3, 3],
                "atk": [2, 2, 2]
            }
        },
        {
            "type": "monster",
            "name": "The Forbidden Door",
            "body": "Daaaaare you enter",
            "stats": {
                "def": [2],
                "atk": [2]
            }
        },
        {
            "type": "monster",
            "name": "Hoopsnake",
            "body": "Bites its tail and rolls around like a little hoop. Afraid of sticks.",
            "stats": {
                "def": [1, 1, 1],
                "atk": [2, 2]
            }
        }
        
    ]
}

/** IDEAS
 * 
 *  ball of yarn --> pulls you out of a dungeon mid-fight, retaining wins OR defeats a cat
 *  --> item that makes you attack first when drawing a card
 *  --> bet one of your dice before drawing for more loot
 */

 /** COMBAT SYSTEM
  *  
  *  enemy has preset dice for atk and def
  *  roll your dice against theirs
  *  highest die knocks out highest die
  *  defence wins a tie
  *  
  *  warriors can combine their current highest die with their current second highest die to get extra damage, still only attacks one enemy die though
  *  rangers can split a die -- attacking with a 6 could take out two 3s
  *  mages get bonuses for straights and pairs
  * 
  * 
  */