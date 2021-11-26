const item = document.querySelectorAll(".menu__item");
const icon = document.querySelectorAll(".menu__icon");
const text = document.querySelectorAll(".menu__text");
const active = document.querySelector("#active");
const active2 = document.querySelector("#active-2");
const active3 = document.querySelector("#active-3");
let colors = ["#ff8800","#ff8800", "#ff8800","#ff8800"]; /*"#c6a700","#c25e00", "#b91400","#5c007a"*/
var currentidx = 0;
/* */
let getItem = (event) => {
    getIcon();
    let indexItem = event.currentTarget.id;
    indexItem = indexItem.split("i-").join("");

    //remove active class from all the panels
  removeClasses(DOMstrings.stepFormPanels, 'js-active');

  //show active panel
  DOMstrings.stepFormPanels.forEach((elem, index) => {
    
    if (index == indexItem) {
      elem.classList.add('js-active');
      setFormHeight(elem);
      currentidx = indexItem;
    }
  });

    active.style.left = `${(indexItem * 120) + 2}px`;  //`${(indexItem * 100) + 10}px`
    active.style.background = colors[indexItem];

    active2.style.left = `${(indexItem * 120) + 15}px`; //`${(indexItem * 100) + 10}px`
    active2.style.background = colors[indexItem];
    active2.classList.add("is-item-animated");

    active3.style.left = `${(indexItem * 122) + 90}px`; //`${(indexItem * 100) + 70}px`
    active3.style.background = colors[indexItem];
    active3.classList.add("is-item-animated");

    
    event.currentTarget.children[0].classList.add("is-icon-visible");
    event.currentTarget.children[1].classList.add("is-text-visible");
    
    setTimeout(() => {
        active.classList.remove("is-item-animated");
    }, 300);
    
}

let getIcon = (event) =>{
    for (var i = 0; i < icon.length; i++) {
        icon[i].classList.remove("is-icon-visible");
    }
    for (var i = 0; i < text.length; i++) {
        text[i].classList.remove("is-text-visible");
    }
}

let mainFunc = (event) =>{
    for (var i = 0; i < item.length; i++) {
        item[i].addEventListener("click", getItem);
    }
}
/* */
window.addEventListener("load", mainFunc);

//DOM elements
const DOMstrings = {
  stepsBtnClass: 'multisteps-form__progress-btn',
  stepsBtns: document.querySelectorAll(`.multisteps-form__progress-btn`),
  stepsBar: document.querySelector('.multisteps-form__progress'),
  stepsForm: document.querySelector('.multisteps-form__form'),
  stepsFormTextareas: document.querySelectorAll('.multisteps-form__textarea'),
  stepFormPanelClass: 'multisteps-form__panel',
  stepFormPanels: document.querySelectorAll('.multisteps-form__panel'),
  stepPrevBtnClass: 'js-btn-prev',
  stepNextBtnClass: 'js-btn-next' };


//remove class from a set of items
const removeClasses = (elemSet, className) => {

  elemSet.forEach(elem => {

    elem.classList.remove(className);

  });

};

//return exect parent node of the element
const findParent = (elem, parentClass) => {

  let currentNode = elem;

  while (!currentNode.classList.contains(parentClass)) {
    currentNode = currentNode.parentNode;
  }

  return currentNode;

};

//get active button step number
const getActiveStep = elem => {
  return Array.from(DOMstrings.stepsBtns).indexOf(elem);
};

//set all steps before clicked (and clicked too) to active
const setActiveStep = activeStepNum => {

  //remove active state from all the state
  removeClasses(DOMstrings.stepsBtns, 'js-active');

  //set picked items to active
  DOMstrings.stepsBtns.forEach((elem, index) => {

    if (index <= activeStepNum) {
      elem.classList.add('js-active');
    }

  });
};

//get active panel
const getActivePanel = () => {

  let activePanel;

  DOMstrings.stepFormPanels.forEach(elem => {

    if (elem.classList.contains('js-active')) {

      activePanel = elem;

    }

  });

  return activePanel;

};

//open active panel (and close unactive panels)
const setActivePanel = activePanelNum => {

  //remove active class from all the panels
  removeClasses(DOMstrings.stepFormPanels, 'js-active');

  //show active panel
  DOMstrings.stepFormPanels.forEach((elem, index) => {
    if (index === activePanelNum) {

      elem.classList.add('js-active');

      setFormHeight(elem);

    }
  });

};

//set form height equal to current panel height
const formHeight = activePanel => {

  const activePanelHeight = activePanel.offsetHeight;

  DOMstrings.stepsForm.style.height = `${activePanelHeight}px`;

};

const setFormHeight = () => {
  const activePanel = getActivePanel();

  formHeight(activePanel);
};

//STEPS BAR CLICK FUNCTION
DOMstrings.stepsBar.addEventListener('click', e => {

  //check if click target is a step button
  const eventTarget = e.target;

  if (!eventTarget.classList.contains(`${DOMstrings.stepsBtnClass}`)) {
    return;
  }

  //get active button step number
  const activeStep = getActiveStep(eventTarget);

  //set all steps before clicked (and clicked too) to active
  setActiveStep(activeStep);

  //open active panel
  setActivePanel(activeStep);
});

//PREV/NEXT BTNS CLICK
DOMstrings.stepsForm.addEventListener('click', e => {

  const eventTarget = e.target;

  //check if we clicked on `PREV` or NEXT` buttons
  if (!(eventTarget.classList.contains(`${DOMstrings.stepPrevBtnClass}`) || eventTarget.classList.contains(`${DOMstrings.stepNextBtnClass}`)))
  {
    return;
  }

  //find active panel
  const activePanel = findParent(eventTarget, `${DOMstrings.stepFormPanelClass}`);

  let activePanelNum = Array.from(DOMstrings.stepFormPanels).indexOf(activePanel);

  
  //getIcon();
  //let indexItem = e.currentTarget.id;
  //indexItem = indexItem.split("i-").join("");

  //set active step and active panel onclick
  if (eventTarget.classList.contains(`${DOMstrings.stepPrevBtnClass}`)) {
    activePanelNum--;
    currentidx--;

  } else {

    activePanelNum++;
    currentidx++;
  }

  setActiveStep(activePanelNum);
  setActivePanel(activePanelNum);

  //---------------------------control the button icon----------------------------
  var str = "i-" + currentidx.toString();;
  document.getElementById(str).click(); 

  //------------------------------------------------------------------------------

});

//SETTING PROPER FORM HEIGHT ONLOAD
window.addEventListener('load', setFormHeight, false);

//SETTING PROPER FORM HEIGHT ONRESIZE
window.addEventListener('resize', setFormHeight, false);

//changing animation via animation select !!!YOU DON'T NEED THIS CODE (if you want to change animation type, just change form panels data-attr)

const setAnimationType = newType => {
  DOMstrings.stepFormPanels.forEach(elem => {
    elem.dataset.animation = newType;
  });
};

//selector onchange - changing animation
const animationSelect = document.querySelector('.pick-animation__select');

animationSelect.addEventListener('change', () => {
  const newAnimationType = animationSelect.value;

  setAnimationType(newAnimationType);
});
