// ==UserScript==
// @name         VerzamelBD
// @namespace    http://tampermonkey.net/
// @version      2025-04-05
// @description  Maak het leven wat makkelijker voor jezelf:)
// @author       -
// @match        https://*.grepolis.com/game/*
// @icon         https://gme.cyllos.dev/res/bdready.png
// @grant GM_setValue
// @grant GM_getValue
// @grant unsafeWindow
// ==/UserScript==

(function() {
    'use strict';

    //Global Variables
    var bdFunctions = unsafeWindow.bdFunctions = {};
    var settings = {};
    var stats = {};
    var switchBool = false;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        console.log("VerzamelBD: DOM geladen, startup functies worden uitgevoerd.");
        // Voeg hier jouw functies toe:
        laadSettings();
        sessieReset();
        laadStats();
        voegBoerendorpIcoonToe();

    }

    function laadCSS(){
        var style=document.createElement('style');
        style.innertext(`
        .bdCounter {
    position: absolute;
    color: #fff;
    text-shadow: #000 1px 1px;
    font-weight: 700;
    font-family: Arial;
    font-size: 12px;
    left: 1px;
    top: -1px;
    background-color: rgba(0,0,0,0.5);
}
`);
        document.body.appendChild(style);
        console.log("VerzamelBD: Added CSS");
    }

    function laadSettings(){
        settings.bdSwitch = GM_getValue("setting_bdSwitch",1) // 1 = aan, 0 = uit
        settings.bdTijd = GM_getValue("setting_bdTijd",0); // 0|1|2|3 -> 5/10 | 20/40 | 1:30/3:00 | 4:00/8:00
    }

    function laadStats(){
        stats.verzamelAantalTotaal = GM_getValue("stat_verzamelAantalTotaal",0);
        stats.verzamelAantalSessie = GM_getValue("stat_verzamelAantalSessie",0);

        stats.gsVerzamelAantalTotaal = GM_getValue("stat_gsVerzamelAantalTotaal",0);
        stats.gsVerzamelAantalSessie = GM_getValue("stat_gsVerzamelAantalSessie",0);


        stats.verzamelAantalT0 = GM_getValue("stat_verzamelAantalT0",0); // 5/10m
        stats.verzamelAantalT1 = GM_getValue("stat_verzamelAantalT1",0); // 20/40m
        stats.verzamelAantalT2 = GM_getValue("stat_verzamelAantalT2",0); // 1:30/3:00u
        stats.verzamelAantalT3 = GM_getValue("stat_verzamelAantalT3",0); // 4:00/8:00u
    }

    function sessieReset(){
        GM_setValue("stat_verzamelAantalSessie",0)
        GM_setValue("stat_gsVerzamelAantalSessie",0)
    }
    //maakt kleine delay
    function sleep (ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    //Random integer
    function getRandomInt (min, max) {
        return Math.floor (Math.random () * (max - min + 1) ) + min;
    }

    bdFunctions.changeValue = function (address, value){
        GM_setValue(address,value);
        console.log(address + " was set to: " + value)
    }

    bdFunctions.requestValue = function (address){
        var value = stats.address
        console.log(address.toString() + " has a value of: " + value)

    }


    bdFunctions.printMemory = function (){
        console.log("Settings:");
        console.log("bdSwitch: " + settings.bdSwitch);
        console.log("Switchbool: " + switchBool);
        console.log("bdTijd: " + settings.bdTijd);
        console.log("Stats");
        console.log("Totaal verzameld: " + stats.verzamelAantalTotaal);
        console.log("Sessie verzameld: " + stats.verzamelAantalSessie);
    }

    function windowExistByTitle(classname,title){
        var windowExists = false;
        var windowItem = null;

        for (var item of document.getElementsByClassName(classname)) {
            if (item.innerHTML == title) {
                windowExists = true;
                windowItem = item;
                break;
            }
        }
        return [windowExists, windowItem]
    }

    //opent bd overzicht -> selecteert alle steden -> verzamelt
    bdFunctions.verzamelBD = async function () {
        laadStats();
        // Stap 1: Open het Farming Town Overview venster
        javascript:Layout.wnd.Create(Layout.wnd.TYPE_FARM_TOWN_OVERVIEWS, "Farming Town Overview");void(0);
        console.log("📂 Farming Town Overview geopend");

        await sleep(200);

        // Stap 2: Checkbox aanvinken
        const checkbox = document.querySelector("#fto_town_wrapper > div > div.game_header.bold > span.checkbox_wrapper > a");
        if (checkbox && !checkbox.classList.contains('checked')) {
            checkbox.click();
            console.log("☑️ Checkbox clicked.");
        } else {
            console.log("⚠️ Checkbox niet gevonden of al aangevinkt.");
        }

        await sleep(500);

        // Stap 3: Klik op de 'Verzamelen'-knop
        const verzamelDivs = document.querySelectorAll('div.caption.js-caption');
        let clicked = false;
        for (const div of verzamelDivs) {
            const span = div.querySelector('span');
            if (span && span.textContent.trim() === 'Verzamelen') {
                try {div.click();}
                catch (error){console.log(error); console.log("could not click: 'verzamelen'"); break;}
                console.log("🖱️ Verzamelen knop geklikt.");
                clicked = true;
                GM_setValue("stat_verzamelAantalTotaal", stats.verzamelAantalTotaal + 1)
                GM_setValue("stat_verzamelAantalSessie", stats.verzamelAantalSessie + 1)

                var verzamelAantal = parseInt(document.querySelector("#max_claim_resources").innerHTML.substring(1));
                console.log("verzamelAantal: " + verzamelAantal);

                GM_setValue("stat_gsVerzamelAantalTotaal", stats.gsVerzamelAantalTotaal + verzamelAantal);
                GM_setValue("stat_gsVerzamelAantalSessie", stats.gsVerzamelAantalSessie + verzamelAantal);

                var [alreadyOpen, alreadyOpenItem] = windowExistByTitle('ui-dialog-title',"Boerendorp Instellingen");

                if (alreadyOpen){maakBoerendorpMenu();}
                break;
            }
        }
        if (!clicked) {
            console.log("❌ Verzamelen knop niet gevonden.");
        }
        await sleep(100);

        var [bdWindowExists,bdWindow] = windowExistByTitle('ui-dialog-title','Farming Town Overview');
        console.log(bdWindowExists, bdWindow);

        if (bdWindowExists) {
            const parent = bdWindow.parentElement;
            console.log(parent);

            if (!parent) {
                console.log("⚠️ Geen BD dialog gevonden.");
                return;
            }

            try{
                //console.log(parent)
                var closeButton = parent.children[1];
                //console.log(closeButton)
                closeButton.click()
                console.log("BD dialog gesloten");
            }
            catch (error){
                console.log("BD dialog niet kunnen sluiten: " + error);
            }

        }
    }


    //kijkt of bds beschikbaar zijn.
    bdFunctions.bdBeschikbaar = function(){
        const counterDiv = document.querySelector("#ui_box > div.toolbar_buttons > div.toolbar_button.boerendorpKnop > div");
        if ((counterDiv && counterDiv.classList.contains('actief')) || (counterDiv.querySelector('div')?.innerText.trim() === '0')){
            console.log("Boerendorpen zijn beschikbaar!");
            var rand = getRandomInt(1,20);
            await sleep(1000);
            bdFunctions.verzamelBD()
            }
    }

    //interval van 10s
    const interval = setInterval(() => {
        //console.log("bdInterval")
        laadSettings();
        if (settings.bdSwitch === 1){
            bdFunctions.bdBeschikbaar();
        }
    },10000);

    // Voegt een icoon toe om naar de bd instellingen te komen
    function voegBoerendorpIcoonToe() {
    if (document.getElementById('BoerendorpSetupLink') === null) {
        var a = document.createElement('div');
        a.id = "BoerendorpSetupLink";
        a.className = 'btn_boerendorp circle_button';
        // Maak een icoon-element (pas de URL en styling aan zoals gewenst)
        var img = document.createElement('div');
        img.className = 'bdCounter'
        img.style.margin = '5px 0px 0px 5px';
        img.style.backgroundImage = "url(https://gme.cyllos.dev/res/bdready.png)";
        img.style.width = '22px';
        img.style.height = '22px';
        img.style.backgroundSize = '100%';

        //img.style.color = 'white';
        //img.innerText = stats.verzamelAantalSessie;
        
        // Positioneer het icoon op een andere plek (bijvoorbeeld links of op een andere hoogte)
        a.style.position = 'absolute';
        a.style.top = '140px';
        a.style.right = '110px';
        a.style.zIndex = '999';

        a.appendChild(img);
        document.getElementById('ui_box').appendChild(a);
        // Klik op het icoon opent het boerendorp menu
        $("#BoerendorpSetupLink").click(function (){
            laadStats();
            maakBoerendorpMenu();

        });
    }
}

    // Maak een nieuw dialoogvenster aan voor boerendorp instellingen
    function maakBoerendorpMenu() {
        // Zorg dat er maar 1 venster tegelijk open kan:

        var [menuExist, menuItem] = windowExistByTitle('ui-dialog-title',"Boerendorp Instellingen");

        if (menuExist) {
            // Als er al een venster bestaat, verwijderen we het geheel:
            var title = menuItem;
            var dialog = title.parentElement.parentElement; // selecteer het hele dialog-frame
            dialog.remove();
        }

        var wnd = Layout.wnd.Create(Layout.wnd.TYPE_DIALOG, "Boerendorp Instellingen");
        wnd.setContent('');
        wnd.setHeight(450);  // Pas de hoogte aan indien nodig
        wnd.setWidth(350);   // Pas de breedte aan indien nodig
        wnd.setTitle("Boerendorp Instellingen");

        // Maak een container voor de inhoud
        var container = document.createElement('div');
        container.style.padding = '10px';
        container.style.fontSize = '12px';

         // Voeg een switch/slider toe voor setting_bdSwitch (1 = aan, 0 = uit)
        var switchContainer = document.createElement('div');
        //switchContainer.style.marginTop = '15px';
        //switchContainer.style.overflow = 'hidden';

        var switchLabel = document.createElement('h3');
        //switchLabel.style.float = 'left';
        switchLabel.style.display = "inline-block";
        switchLabel.style.textAlign = "center";
        switchLabel.verticalAlign = "middle";
        switchLabel.innerHTML = "Automatisch verzamelen:";
        // Zorg dat de label in verband staat met het invoerelement
        switchLabel.htmlFor = "bdSwitchInput";
        switchContainer.appendChild(switchLabel);

        var switchInput = document.createElement('input');
        switchInput.type = 'checkbox';
        switchInput.id = "bdSwitchInput";
        switchInput.style.display = "inline-block";
        switchInput.verticalAlign = "middle";
        //switchInput.style.float = 'left';
        //switchInput.style.overflow = 'hidden';
        // Zet de checkbox aan of uit afhankelijk van de huidige waarde
        if (GM_getValue("setting_bdSwitch", 1) === 1){switchBool = true;}else{switchBool = false;}

        switchInput.checked = switchBool;
        switchInput.style.marginLeft = '10px';
        switchContainer.appendChild(switchInput);

        container.appendChild(switchContainer);

        //radiosection
        var radioSection = document.createElement('div');
        radioSection.style.marginTop = '10px';
        radioSection.style.borderTop = '1px solid #ccc';
        radioSection.style.paddingTop = '5px';

        // Header: kies de duur van boerendorp verzamelen
        var header = document.createElement('h3');
        header.style.textDecoration = "line-through";
        header.innerHTML = "Selecteer duur:";
        radioSection.appendChild(header);

        // Maak de radio buttons (mutually exclusive opties)
        var options = [
            { value: "600", text: "10 minuten" },
            { value: "2400", text: "40 minuten" },
            { value: "10800", text: "3 uur" },
            { value: "28800", text: "8 uur" }
        ];
        var radioGroup = document.createElement('div');
        options.forEach(function(opt) {
            var radioContainer = document.createElement('div');
            radioContainer.style.marginBottom = "5px";

            var radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'boerendorpDuration';
            radio.value = opt.value;
            // Indien er al een instelling is opgeslagen (standaard "600")
            if (GM_getValue('boerendorpDuration', "600") === opt.value) {
                radio.checked = true;
            }
            radioContainer.appendChild(radio);

            var label = document.createElement('label');
            label.innerHTML = opt.text;
            label.style.textDecoration = "line-through";
            label.style.marginLeft = '5px';
            radioContainer.appendChild(label);

            radioGroup.appendChild(radioContainer);
        });
        radioSection.appendChild(radioGroup);
        container.appendChild(radioSection);


        // Maak een sectie voor de statistieken
        var statsSection = document.createElement('div');
        statsSection.style.marginTop = '15px';
        statsSection.style.borderTop = '1px solid #ccc';
        statsSection.style.paddingTop = '10px';

        var statsHeader = document.createElement('h4');
        statsHeader.innerHTML = "Statistieken";
        statsSection.appendChild(statsHeader);

        var totalStats = document.createElement('p');
        totalStats.innerHTML = "Totaal automatisch verzameld: " + stats.verzamelAantalTotaal;
        statsSection.appendChild(totalStats);

        var sessionStats = document.createElement('p');
        sessionStats.innerHTML = "Deze sessie: " + stats.verzamelAantalSessie;
        statsSection.appendChild(sessionStats);

        var totalGsStats = document.createElement('p');
        totalGsStats.innerHTML = "Totaal grondstoffen automatisch verzameld: " + stats.gsVerzamelAantalTotaal;
        statsSection.appendChild(totalGsStats);

        var sessionGsStats = document.createElement('p');
        sessionGsStats.innerHTML = "Grondstoffen deze sessie : " + stats.gsVerzamelAantalSessie;
        statsSection.appendChild(sessionGsStats);

        container.appendChild(statsSection);

        // Voeg de inhoud toe aan het dialoogvenster
        wnd.setContent(container.outerHTML);

        $("#bdSwitchInput").prop("checked", switchBool);

        // Omdat we de content als HTML-string zetten, binden we nu de event listener via jQuery:
        $("#bdSwitchInput").change(function() {
            var newValue = $(this).is(":checked") ? 1 : 0;
            GM_setValue("setting_bdSwitch", newValue);
            // Roep direct de laadSettings() functie aan zodat de wijzigingen direct worden toegepast
            laadSettings();
            console.log("setting_bdSwitch is nu: " + newValue);
        });
    }

        // Voeg een event listener toe voor de radio buttons (na een korte vertraging zodat de DOM up-to-date is)
        setTimeout(function() {
            
                $("input[name='boerendorpDuration']").change(function() {
                    var selected = $("input[name='boerendorpDuration']:checked").val();
                    GM_setValue('boerendorpDuration', selected);
                    console.log("Boerendorp duur ingesteld op: " + selected);
                });
            
        }, 100);
    }

)();
