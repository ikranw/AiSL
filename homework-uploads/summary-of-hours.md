# Summary of Hours and Justification

## Team Members

* Elshaddai Melaku, Project Manager, LLM development
* Ikran Warsame, Project Manager, 3D avatar/animation and ASL community coordination
* Fareena Khan, Project Manager, UI and integration

**Advisor:** Dr. Jillian Aurisano

---

## Work Structure

**Fall Semester**
* Weekly meetings: Thursdays, 3:30 PM - 5:00 PM (1.5 hrs/week), starting September 1
* Focus: research, architecture decisions, system design, and documentation
* Individual work: ~3-8 hrs/week

**Spring Semester**
* Weekly meetings: Wednesdays, 3:30 PM - 5:00 PM (1.5 hrs/week)
* Focus: active development and system integration
* Individual work: ~3-8 hrs/week

**Spring Break Intensive (March 14-22)**
* Daily sessions, 1:00 PM - 6:00 PM (~5 hrs/day)

**Post-Break Sprint (March 23 - April 7 Expo)**
* ~1.5 hrs/day in group sessions (~7.5 hrs/week) plus ~6 hrs/week individual work

---

## Meeting Log

### Fall Semester

#### Week of September 1
* Thurs (1.5 hrs): First meeting, project framing, role alignment, initial brainstorm

#### Week of September 8
* Thurs (1.5 hrs): Reviewed ASL translation research; scoped feasibility of the approach

#### Week of September 15
* Thurs (1.5 hrs): Investigated potential features; discussed avatar options and sign datasets

#### Week of September 22
* Thurs (1.5 hrs): Evaluated tech stack options; discussed LLM constraints for ASL gloss generation

#### Week of September 29
* Thurs (1.5 hrs): Defined user stories; early UI/UX thinking around the translation workflow

#### Week of October 6
* Thurs (1.5 hrs): Continued design planning; started draft diagrams and system documentation

#### Week of October 13
* Thurs (1.5 hrs): Mapped out pipeline architecture from English input to Unity playback

#### Week of October 20
* Thurs (1.5 hrs): Finalized development environment decisions; assigned component ownership

#### Week of October 27
* Thurs (1.5 hrs): Translated architecture decisions into concrete implementation tasks

#### Week of November 3
* Thurs (1.5 hrs): Reviewed early progress on backend scaffolding and frontend setup

#### Week of November 10
* Thurs (1.5 hrs): Discussed LLM prompting strategy and avatar animation pipeline

#### Week of November 17
* Thurs (1.5 hrs): Reviewed backend retrieval logic and frontend component structure

#### Week of November 24
* Thurs (1.5 hrs): Fall semester wrap-up; documented current state and spring priorities

---

## Winter Break (December - January)

* Team took a break from meetings
* Used the time for individual review, research, and preparation ahead of the spring semester

---

## Spring Semester

#### Week of January 13
* Wed (1.5 hrs): Reconvened as a team; reviewed fall work, set spring goals; basic UI scaffolding started

#### Week of January 20
* Wed (1.5 hrs): Basic UI completed; continued planning for backend and integration work

#### Week of January 27
* Wed (1.5 hrs): Began broader development; backend API structure and initial LLM prompting setup

#### Week of February 3
* Wed (1.5 hrs): ASL grammar pipeline planning; discussed gloss normalization requirements

#### Week of February 10
* Wed (1.5 hrs): Unity/frontend bridge implementation; reviewed sign sequence handoff

#### Week of February 17
* Wed (1.5 hrs): Cross-component integration work; debugging and performance discussion

#### Week of February 24
* Wed (1.5 hrs): End-to-end system testing; sign inventory validation and gap analysis

#### Week of March 3
* Wed (1.5 hrs): Full pipeline review; addressed remaining integration issues

#### Week of March 10
* Wed (1.5 hrs): Demo prep begun; frontend polish and avatar playback refinement

---

## Spring Break Intensive (March 14-22)

Daily sessions, 1:00 PM - 6:00 PM. **~5 hrs/day x 9 days = ~45 hrs per member**

Work during this period:
* End-to-end pipeline testing and bug fixes
* Avatar animation tuning and sign clip mapping
* Frontend UI polish and sign video mode improvements
* Poster design and presentation development
* Report writing and documentation

---

## Post-Break Sprint (March 23 - April 7)

~1.5 hrs/day in group sessions (~7.5 hrs/week), plus ~6 hrs/week of individual work.

Work during this period:
* Final system integration and stability fixes
* Expo demo preparation and rehearsal
* Poster finalization
* Senior design report completion

---

## Individual Work

Each team member contributed approximately 3-8 additional hours per week throughout the year. This included heavy research in both semesters, particularly around ASL linguistics, dataset limitations, and tooling decisions, as well as hands-on implementation and testing. Despite working across different technical areas, team members regularly cross-collaborated to understand each other's components and help debug issues outside their own domain.

* **Elshaddai Melaku:** Research into LLM constraints for ASL gloss generation, prompt engineering, RAG pipeline development, gloss validation and normalization, backend API implementation
* **Ikran Warsame:** Research into ASL grammar and signing conventions, Unity scene and avatar rigging, sign animation clip mapping, ASL community outreach and feedback integration
* **Fareena Khan:** Research into accessible UI patterns and WebGL embedding, React frontend development, Unity WebGL integration, UI/UX design, backend/frontend wiring and deployment

---

## Total Hours Estimate (Per Member)

| Phase | Duration | Meeting Hrs | Individual Hrs | Subtotal |
|---|---|---|---|---|
| Fall semester | ~13 weeks | 1.5 hrs/week (~19.5 hrs) | ~5 hrs/week avg (~65 hrs) | ~84.5 hrs |
| Spring semester (pre-break) | ~9 weeks | 1.5 hrs/week (~13.5 hrs) | ~5 hrs/week avg (~45 hrs) | ~58.5 hrs |
| Spring break intensive | 9 days | ~5 hrs/day (~45 hrs) | ~3 hrs/day (~27 hrs) | ~72 hrs |
| Post-break sprint | ~2 weeks | ~7.5 hrs/week (~15 hrs) | ~6 hrs/week (~12 hrs) | ~27 hrs |

**Final Estimated Total: ~120-150 hours per member**

---

## Justification

AiSL required building and connecting four distinct technical layers: a React frontend, a Flask backend with a retrieval-augmented LLM pipeline, a Unity-based 3D avatar system, and a WebGL bridge connecting them. Each layer involved its own research, implementation, and testing cycle, and none were off-the-shelf. The sign animation mapping, gloss normalization logic, and Unity/React integration were all custom-built.

The fall semester was primarily research-intensive: understanding ASL linguistics, evaluating dataset options, and designing an architecture that could support constrained LLM output rather than unconstrained text generation. The spring semester shifted to active development and system-wide integration. The spring break intensive and final sprint reflect the volume of work required to bring all components together, prepare a functional live demo, and complete the full senior design deliverables. Our shared project notebook is large and contains sensitive information throughout, so it is not included here; the repository's git history should sufficiently demonstrate the progression and scope of our work.
