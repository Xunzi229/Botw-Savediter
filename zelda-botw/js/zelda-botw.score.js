/*
 * BOTW enemy/weapon scaling score calculator.
 * Based on Marc Robledo's editor implementation restored from cutecryptid's work:
 * https://github.com/MarcRobledo/savegame-editors/blob/master/zelda-botw/zelda-botw.score.js
 */
var BOTWScoreCalculator = (function () {
    'use strict';

    var enemyPoints = {
        Defeated_Enemy_Wizzrobe_Electric_Num: 5,
        Defeated_Enemy_Wizzrobe_Fire_Num: 5,
        Defeated_Enemy_Wizzrobe_Ice_Num: 5,
        Defeated_Enemy_Guardian_A_Fixed_Moss_Num: 12,
        Defeated_Enemy_Golem_Junior_Num: 15,
        Defeated_Enemy_Giant_Junior_Num: 15,
        Defeated_Enemy_Assassin_Middle_Num: 15,
        Defeated_Enemy_Bokoblin_Senior_Num: 15,
        Defeated_Enemy_Wizzrobe_Ice_Senior_Num: 15,
        Defeated_Enemy_Wizzrobe_Fire_Senior_Num: 15,
        Defeated_Enemy_Wizzrobe_Electric_Senior_Num: 15,
        Defeated_RemainsFire_Drone_A_01_Num: 15,
        Defeated_Enemy_Moriblin_Senior_Num: 18,
        Defeated_Enemy_Guardian_Mini_Middle_Num: 20,
        Defeated_Enemy_Lizalfos_Electric_Num: 20,
        Defeated_Enemy_Lizalfos_Ice_Num: 20,
        Defeated_Enemy_Lizalfos_Senior_Num: 20,
        Defeated_Enemy_Lizalfos_Fire_Num: 20,
        Defeated_Enemy_Bokoblin_Gold_Num: 25,
        Defeated_Enemy_Giant_Bone_Num: 25,
        Defeated_Enemy_Bokoblin_Dark_Num: 25,
        Defeated_Enemy_Golem_Middle_Num: 25,
        Defeated_Enemy_Giant_Middle_Num: 25,
        Defeated_Enemy_Golem_Senior_Num: 30,
        Defeated_Enemy_Golem_Fire_Num: 35,
        Defeated_Enemy_Moriblin_Gold_Num: 35,
        Defeated_Enemy_Guardian_Mini_Senior_Num: 35,
        Defeated_Enemy_Guardian_B_Num: 35,
        Defeated_Enemy_Golem_Ice_Num: 35,
        Defeated_Enemy_Moriblin_Dark_Num: 35,
        Defeated_Enemy_Golem_Fire_R_Num: 35,
        Defeated_Enemy_Giant_Senior_Num: 35,
        Defeated_Enemy_Lizalfos_Dark_Num: 40,
        Defeated_Enemy_Lizalfos_Gold_Num: 40,
        Defeated_Enemy_SandwormR_Num: 50,
        Defeated_Enemy_Guardian_A_Num: 50,
        Defeated_Enemy_Guardian_C_Num: 50,
        Defeated_Enemy_Sandworm_Num: 50,
        Defeated_Enemy_Lynel_Junior_Num: 50,
        Defeated_Enemy_Lynel_Middle_Num: 60,
        Defeated_Enemy_Lynel_Senior_Num: 80,
        Defeated_Enemy_Assassin_Senior_Num: 100,
        Defeated_Enemy_Lynel_Gold_Num: 120,
        Defeated_Enemy_Lynel_Dark_Num: 120,
        Defeated_Enemy_SiteBoss_Lsword_Num: 300,
        Defeated_Enemy_SiteBoss_Spear_Num: 300,
        Defeated_Enemy_SiteBoss_Sword_Num: 300,
        Defeated_Enemy_SiteBoss_Bow_Num: 300,
        Defeated_Priest_Boss_Normal_Num: 500,
        Defeated_Enemy_GanonBeast_Num: 800
    };

    var crcTable = (function () {
        var table = [];
        for (var n = 0; n < 256; n++) {
            var c = n;
            for (var k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
            table[n] = c;
        }
        return table;
    }());

    function crc32(value) {
        var crc = -1;
        for (var i = 0; i < value.length; i++) crc = (crc >>> 8) ^ crcTable[(crc ^ value.charCodeAt(i)) & 0xff];
        return (crc ^ -1) >>> 0;
    }

    var pointsByHash;

    return {
        calculate: function () {
            if (!pointsByHash) {
                pointsByHash = {};
                Object.keys(enemyPoints).forEach(function (flag) {
                    pointsByHash[crc32(flag)] = enemyPoints[flag];
                });
            }

            var score = 0;
            var previousHash = 0;
            for (var offset = 0x0c; offset < tempFile.fileSize - 4; offset += 8) {
                var hash = tempFile.readU32(offset);
                if (hash === previousHash) continue;
                previousHash = hash;
                if (pointsByHash[hash]) score += pointsByHash[hash] * tempFile.readU32(offset + 4);
            }
            return score;
        }
    };
}());
