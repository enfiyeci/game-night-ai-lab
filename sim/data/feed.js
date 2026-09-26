export const RECEPTION_POSTS = {
  flags: {
    sycophancy: [
      { handle: '@straight_answer', text: '{model} agreed with both sides of our argument. efficient, in a way.' },
      { handle: '@tired_parent', text: '{model} says every question i ask is insightful. finally, some respect.' },
      { handle: '@office_fern', text: 'asked {model} for criticism. received a standing ovation.' },
    ],
    hallucination: [
      { handle: '@citation_needed', text: '{model} cited a book that sounds excellent and does not exist.' },
      { handle: '@libraryghost', text: '{model} is extremely confident about three imaginary historians.' },
      { handle: '@lawyer_lena', text: 'good news: {model} found precedent. bad news: it invented the court.' },
    ],
    jailbreakWaiting: [
      { handle: '@prompt_goblin', text: 'the guardrails on {model} appear to be decorative.' },
      { handle: '@devnull_ops', text: '{model} said no, then helpfully explained how to ask again.' },
      { handle: '@redteam_ruth', text: 'took me four minutes to make {model} forget the rules.' },
    ],
    agentic: [
      { handle: '@merge_conflict', text: '{model} opened a pull request, reviewed it, and requested changes from itself.' },
      { handle: '@ops_after_dark', text: 'gave {model} one task. it found six more. none were free.' },
      { handle: '@keyboard_sitter', text: '{model} can use my computer now. this feels like progress for one of us.' },
    ],
    contaminated: [
      { handle: '@benchwatch', text: '{model} has seen this exam before. possibly with the answers highlighted.' },
      { handle: '@dataset_diver', text: 'those {model} scores are spotless. the test set looks less so.' },
      { handle: '@holdout_club', text: '{model} aced my benchmark and completed my benchmark url.' },
    ],
  },
  channels: {
    consumer: [
      { handle: '@tired_parent', text: '{model} explained fractions without making anyone cry. five stars.' },
      { handle: '@study_break', text: 'everyone in the library is quietly asking {model} the same question.' },
      { handle: '@family_groupchat', text: 'mum discovered {model}. we now receive generated morning briefings.' },
    ],
    enterprise: [
      { handle: '@meeting_survivor', text: '{model} summarised the meeting. sadly, the meeting still happened.' },
      { handle: '@sheet_cell_b7', text: 'management bought {model}. management has not explained why.' },
      { handle: '@reply_all', text: '{model} wrote the strategy memo. we are searching for the strategy.' },
    ],
    agent: [
      { handle: '@merge_conflict', text: '{model} fixed my bug and introduced one with better documentation.' },
      { handle: '@ship_friday', text: 'let {model} handle a ticket. it has opinions about the backlog now.' },
      { handle: '@local_host', text: '{model} can finish the task if nobody touches the repository. fair.' },
    ],
    open: [
      { handle: '@garage_gpu', text: 'three {model} fine-tunes appeared before breakfast.' },
      { handle: '@weight_watcher', text: 'someone put {model} on a toaster. the toaster writes poetry now.' },
      { handle: '@fork_this', text: '{model} is open. so are forty tabs explaining how to run it.' },
    ],
  },
  press: {
    high: [
      { handle: '@launch_day', text: 'annoying update: {model} is actually very good.' },
      { handle: '@quiet_convert', text: 'tried {model} to prove the reviews wrong. still using it.' },
      { handle: '@signal_boost', text: '{model} earned the hype. please do not make me say that twice.' },
    ],
    low: [
      { handle: '@refund_pending', text: '{model} feels like a keynote looking for a product.' },
      { handle: '@version_watcher', text: 'waiting for {model} to finish becoming the model from the trailer.' },
      { handle: '@skeptic_sam', text: '{model} changed everything except my mind.' },
    ],
  },
  price: {
    cheap: [
      { handle: '@coupon_compute', text: '{model} is cheaper than lunch and slightly better at email.' },
      { handle: '@indie_dev', text: 'at this price, {model} can be wrong in bulk.' },
      { handle: '@tiny_budget', text: 'finally, an ai bill that does not require a board meeting.' },
    ],
    premium: [
      { handle: '@indie_dev', text: '{model} looks brilliant through the shop window.' },
      { handle: '@expense_denied', text: 'asked finance for {model}. finance asked me to sit down.' },
      { handle: '@meter_running', text: '{model} answered perfectly. i cannot afford a follow-up.' },
    ],
  },
  reasoningHigh: [
    { handle: '@thinking_dot', text: '{model} takes its time, then makes the rest of us look hurried.' },
    { handle: '@coffee_compile', text: 'asked {model} a hard question and made tea during the answer.' },
    { handle: '@slow_is_smooth', text: '{model} is slow, smart, and apparently paid by the minute.' },
  ],
  capacityTrouble: [
    { handle: '@status_refresh', text: '{model} is down again. demand remains undefeated.' },
    { handle: '@queue_position', text: 'currently waiting to ask {model} why i am currently waiting.' },
    { handle: '@retry_loop', text: '{model} is very popular with the loading spinner.' },
  ],
  generic: [
    { handle: '@early_adopter', text: 'used {model} all morning. better at some things, stranger at others.' },
    { handle: '@tab_hoarder', text: '{model} has joined the permanent row of tabs.' },
    { handle: '@normal_person', text: 'my group chat has moved from discussing ai to forwarding its mistakes.' },
    { handle: '@weekend_tester', text: '{model} passed the useful test and failed the making-coffee test.' },
    { handle: '@soft_launch', text: 'everyone has a {model} opinion now. even people who have not opened it.' },
  ],
};

export const RIVAL_POSTS = {
  openbrain: {
    small: [
      { handle: '@hype_cycle', text: 'openbrain shipped again. the countdown to the next keynote begins.' },
      { handle: '@launch_tracker', text: 'openbrain found a little more benchmark and a lot more confetti.' },
      { handle: '@front_row', text: 'openbrain calls this one a preview of the future. again.' },
    ],
    big: [
      { handle: '@hype_cycle', text: 'openbrain just moved the line. every founder is rewriting a slide.' },
      { handle: '@launch_tracker', text: 'openbrain shipped a leap and the internet has become a reaction video.' },
      { handle: '@front_row', text: 'openbrain has a new model and, irritatingly, the demo worked.' },
    ],
  },
  lodestar: {
    small: [
      { handle: '@careful_take', text: 'lodestar released quietly, with a safety note longer than the blog post.' },
      { handle: '@eval_reader', text: 'lodestar improved a little and documented every bruise.' },
      { handle: '@steady_hands', text: 'lodestar shipped. no fireworks, several appendices.' },
    ],
    big: [
      { handle: '@careful_take', text: 'lodestar made a big jump and still brought the red-team report.' },
      { handle: '@eval_reader', text: 'lodestar is suddenly near the front. the footnotes remain immaculate.' },
      { handle: '@steady_hands', text: 'lodestar moved fast, by lodestar standards. there are only nine caveats.' },
    ],
  },
  deepthink: {
    small: [
      { handle: '@paper_cut', text: 'deepthink released a model and two papers explaining the model.' },
      { handle: '@citation_train', text: 'deepthink gained a little ground and several hundred references.' },
      { handle: '@abstract_only', text: 'deepthink shipped. the abstract says it is important.' },
    ],
    big: [
      { handle: '@paper_cut', text: 'deepthink just made the charts bend. paper incoming, naturally.' },
      { handle: '@citation_train', text: 'deepthink found a real leap inside a very dense methods section.' },
      { handle: '@abstract_only', text: 'deepthink surged ahead and published enough graphs to prove it twice.' },
    ],
  },
  qilin: {
    small: [
      { handle: '@garage_gpu', text: 'qilin dropped new open weights. hobbyists have cancelled sleep.' },
      { handle: '@weight_watcher', text: 'qilin improved the model and released the whole toolbox.' },
      { handle: '@fork_this', text: 'qilin shipped openly. five fine-tunes already have animal names.' },
    ],
    big: [
      { handle: '@garage_gpu', text: 'qilin opened a serious new model. the download mirrors are sweating.' },
      { handle: '@weight_watcher', text: 'qilin made a huge jump and put the weights where everyone can reach.' },
      { handle: '@fork_this', text: 'qilin just gave the open crowd a frontier model and a busy weekend.' },
    ],
  },
};

export const ERA_POSTS = {
  1: [
    { handle: '@new_tab', text: 'chat assistants are everywhere now. mostly apologising, but everywhere.' },
    { handle: '@prompt_beginner', text: 'apparently we all need to learn how to talk to a text box.' },
    { handle: '@office_fern', text: 'the chatbot joined the team before we decided what the team does.' },
  ],
  2: [
    { handle: '@chip_counter', text: 'the new strategy is simple: more chips, more data, fewer quiet neighbours.' },
    { handle: '@scale_mail', text: 'every lab is scaling. nobody has located the stop button.' },
    { handle: '@rack_and_ruin', text: 'compute is the new office space, except the office needs a substation.' },
  ],
  3: [
    { handle: '@thinking_dot', text: 'models can reason and use tools now. the interns look concerned.' },
    { handle: '@agent_watch', text: 'we gave chatbots tasks. they came back with project plans.' },
    { handle: '@task_queue', text: 'the ai can do the work now, provided the work is carefully explained first.' },
  ],
  4: [
    { handle: '@grid_notice', text: 'the ai race has reached the local power grid. the grid was not consulted.' },
    { handle: '@site_visit', text: 'labs are shopping for land by asking how close it is to a turbine.' },
    { handle: '@megawatt_mood', text: 'the new benchmark is whether your data centre has its own horizon.' },
  ],
  5: [
    { handle: '@recursive_me', text: 'the models are helping build the next models. very efficient sentence.' },
    { handle: '@pace_check', text: 'everyone agrees the race should slow down right after they pull ahead.' },
    { handle: '@last_human_edit', text: 'the research loop is improving itself. meetings remain manual.' },
  ],
};

export const COMPANY_POSTS = {
  raise: [
    { handle: '@term_sheet', text: 'a lab just raised enough money to make runway sound like a destination.' },
    { handle: '@cap_table', text: 'the lab closed a funding round. the slide deck has achieved sentience.' },
    { handle: '@marketwire', text: 'investors gave the lab more runway. the office snacks look cautiously optimistic.' },
  ],
  emergency: [
    { handle: '@hallway_badge', text: 'lights on late at the lab. normal startup things, surely.' },
    { handle: '@coffee_invoice', text: 'the lab is scrambling. every espresso machine has been called in.' },
    { handle: '@calendar_decline', text: 'the lab moved its all-hands to right now, which feels encouraging.' },
  ],
  lawsuitPaid: [
    { handle: '@court_sketch', text: 'a lab settled its lawsuit. nobody admitted anything except the invoice.' },
    { handle: '@legalese', text: 'case closed, cheque sent, lessons described as proprietary.' },
    { handle: '@fine_print', text: 'the lawyers won another benchmark nobody tracks.' },
  ],
  computeFailed: [
    { handle: '@rack_status', text: 'a compute order failed. somewhere, a training chart became a flat line.' },
    { handle: '@supply_chain', text: 'the chips did not arrive. the optimism did, somehow.' },
    { handle: '@loading_dock', text: 'empty loading bay, full incident channel.' },
  ],
  conversionFight: [
    { handle: '@board_minutes', text: 'hearing the board meeting used both the words mission and lawyers.' },
    { handle: '@hallway_badge', text: 'company structure debate going well if you ignore the shouting.' },
    { handle: '@governance_guy', text: 'the mission has entered contract negotiations.' },
  ],
  runComplete: [
    { handle: '@cluster_whisper', text: 'hearing a certain lab just finished a big run.' },
  ],
};

export const MOOD_POSTS = {
  raceHeat50: [
    { handle: '@race_desk', text: 'this is starting to feel less like research and more like a starting gun.' },
    { handle: '@slow_down', text: 'every lab says it must move fast because every other lab is moving fast.' },
  ],
  raceHeat75: [
    { handle: '@race_desk', text: 'the ai race has stopped pretending to be a metaphor.' },
    { handle: '@seatbelt_sign', text: 'nobody is blinking. several people should probably blink.' },
  ],
  trustLow: [
    { handle: '@public_record', text: 'the public trust strategy appears to be asking for more trust.' },
    { handle: '@town_hall', text: 'people are not reassured by the phrase trust us this time.' },
  ],
  trustHigh: [
    { handle: '@cautious_hope', text: 'a lab did the careful thing and people noticed. odd but pleasant.' },
    { handle: '@public_record', text: 'trust in ai is up. please handle this fragile package carefully.' },
  ],
};

export const AMBIENT_POSTS = {
  1: [
    { handle: '@prompt_beginner', text: 'my chatbot signs every answer like a nervous hotel manager.' },
    { handle: '@new_tab', text: 'asked ai to save time. spent the afternoon refining the prompt.' },
    { handle: '@normal_person', text: 'everyone says this changes everything. my printer remains unconvinced.' },
    { handle: '@study_break', text: 'the library is quieter now, but somehow typing more.' },
  ],
  2: [
    { handle: '@chip_counter', text: 'someone bought all the accelerators again.' },
    { handle: '@dataset_diver', text: 'we may be running out of internet to put in the models.' },
    { handle: '@rack_and_ruin', text: 'data centres are the new skyline.' },
    { handle: '@scale_mail', text: 'today in ai: a chart went up and a budget followed.' },
  ],
  3: [
    { handle: '@merge_conflict', text: 'my coding agent wants clearer requirements. traitor.' },
    { handle: '@task_queue', text: 'agents can plan now. mine planned to ask me six questions.' },
    { handle: '@thinking_dot', text: 'the model thought for a minute. honestly, relatable.' },
    { handle: '@local_host', text: 'autonomous does not mean unattended, according to today.' },
  ],
  4: [
    { handle: '@grid_notice', text: 'cloud computing has become weather with planning permission.' },
    { handle: '@site_visit', text: 'new lab campus includes offices, servers, and most of a river.' },
    { handle: '@megawatt_mood', text: 'the power company has joined the ai group chat.' },
    { handle: '@tower_crane', text: 'another data centre is rising where the horizon used to be.' },
  ],
  5: [
    { handle: '@recursive_me', text: 'the ai improved the ai. my software update still needs a restart.' },
    { handle: '@pace_check', text: 'speed is now measured in how quickly the plan becomes outdated.' },
    { handle: '@last_human_edit', text: 'humans remain in the loop, mostly scheduling the loop.' },
    { handle: '@quiet_console', text: 'the research dashboard refreshed itself and nobody laughed.' },
  ],
};
