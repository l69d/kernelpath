import type { ComponentType } from "react";
import PointersViz from "./PointersViz";
import HeapAllocViz from "./HeapAllocViz";
import StackFrameViz from "./StackFrameViz";
import TwosComplementViz from "./TwosComplementViz";
import RaceConditionViz from "./RaceConditionViz";
import MutexViz from "./MutexViz";
import DeadlockViz from "./DeadlockViz";
import BranchPredictViz from "./BranchPredictViz";
import InterruptViz from "./InterruptViz";
import SpectreViz from "./SpectreViz";
import ModularArithViz from "./ModularArithViz";
import MatrixTransformViz from "./MatrixTransformViz";
import EigenvectorViz from "./EigenvectorViz";
import EntropyViz from "./EntropyViz";
import BigOViz from "./BigOViz";
import HaltingProblemViz from "./HaltingProblemViz";
import PvsNPViz from "./PvsNPViz";
import LambdaCalcViz from "./LambdaCalcViz";
import GarbageCollectionViz from "./GarbageCollectionViz";
import InductionViz from "./InductionViz";
import ProbabilityViz from "./ProbabilityViz";
import EncapsulationViz from "./EncapsulationViz";
import TcpHandshakeViz from "./TcpHandshakeViz";
import CongestionViz from "./CongestionViz";
import LamportClockViz from "./LamportClockViz";
import RaftViz from "./RaftViz";
import CapTheoremViz from "./CapTheoremViz";
import AcidViz from "./AcidViz";
import BTreeViz from "./BTreeViz";
import MinimaxViz from "./MinimaxViz";
import RegressionViz from "./RegressionViz";
import BiasVarianceViz from "./BiasVarianceViz";
import NeuralNetViz from "./NeuralNetViz";
import ConvolutionViz from "./ConvolutionViz";
import AttentionViz from "./AttentionViz";
import PublicKeyViz from "./PublicKeyViz";

// module id -> abstract-concept hero visualization
export const CONCEPT_VIZ: Record<string, ComponentType> = {
  "t0-04": TwosComplementViz,
  "t1-04": PointersViz,
  "t1-06": HeapAllocViz,
  "t1-07": StackFrameViz,
  "t2-05": BranchPredictViz,
  "t2-10": InterruptViz,
  "t4-03": RaceConditionViz,
  "t4-06": MutexViz,
  "t4-07": DeadlockViz,
  "t11-04": SpectreViz,
  "cs0-03": InductionViz,
  "cs0-06": ProbabilityViz,
  "cs0-08": ModularArithViz,
  "cs1-03": MatrixTransformViz,
  "cs1-04": EigenvectorViz,
  "cs1-08": EntropyViz,
  "cs3-04": BTreeViz,
  "cs4-01": BigOViz,
  "cs5-05": HaltingProblemViz,
  "cs5-07": PvsNPViz,
  "cs6-01": LambdaCalcViz,
  "cs6-06": GarbageCollectionViz,
  "cs8-06": AcidViz,
  "cs9-01": EncapsulationViz,
  "cs9-04": TcpHandshakeViz,
  "cs9-05": CongestionViz,
  "cs10-03": LamportClockViz,
  "cs10-05": RaftViz,
  "cs10-07": CapTheoremViz,
  "cs11-03": MinimaxViz,
  "cs12-02": RegressionViz,
  "cs12-03": BiasVarianceViz,
  "cs12-07": NeuralNetViz,
  "cs13-02": ConvolutionViz,
  "cs13-04": AttentionViz,
  "cs14-03": PublicKeyViz,
};
